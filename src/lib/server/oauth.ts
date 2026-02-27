import { redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { dev } from '$app/environment';

import type { OAuthProfile, OAuthProvider, OAuthState } from '$lib/types';

export type { OAuthProfile, OAuthProvider, OAuthState };

const { GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, APP_URL } = process.env;

const baseUrl = APP_URL || 'https://busserapp.com';

type OAuthTokens = {
	accessToken: string;
	idToken: string | null;
};

// provider-specific config
const providerConfig = {
	google: {
		authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
		tokenUrl: 'https://oauth2.googleapis.com/token',
		userinfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
		scopes: ['openid', 'email', 'profile'],
		clientId: GOOGLE_OAUTH_CLIENT_ID || '',
		clientSecret: GOOGLE_OAUTH_CLIENT_SECRET || '',
	},
	apple: {
		authorizeUrl: 'https://appleid.apple.com/auth/authorize',
		tokenUrl: 'https://appleid.apple.com/auth/token',
		userinfoUrl: '',
		scopes: ['name', 'email'],
		clientId: '',
		clientSecret: '',
	},
} as const satisfies Record<OAuthProvider, unknown>;

function getRedirectUri(provider: OAuthProvider): string {
	return `${baseUrl}/api/oauth/callback/${provider}`;
}

// oauth flow:
// 1. user clicks "sign in with google" -> GET /api/oauth/google?invite=ABC123
// 2. initiation route validates invite code, encodes it into a CSRF state token
// 3. we redirect to provider's consent screen with the state token
// 4. user approves -> provider redirects to GET /api/oauth/callback/google?code=...&state=...
// 5. callback parses state to recover the invite code and verify CSRF
// 6. exchangeCode() swaps the authorization code for access + id tokens
// 7. getProfile() uses the tokens to fetch the user's email, name, and provider id
// 8. callback handler upserts the user, consumes the invite, and issues a jwt session

// generates a state string containing a CSRF token and optional invite code
export function generateOAuthState(inviteCode: string | null = null): string {
	const state: OAuthState = {
		token: crypto.randomUUID(),
		inviteCode: inviteCode || null,
	};
	return btoa(JSON.stringify(state));
}

// decodes a state string back into its components
export function parseOAuthState(state: string): OAuthState {
	try {
		const parsed = JSON.parse(atob(state));
		if (!parsed.token) throw new Error('Missing CSRF token.');
		return { token: parsed.token, inviteCode: parsed.inviteCode || null };
	} catch {
		throw new Error('Invalid OAuth state.');
	}
}

// builds the authorization url for the given provider
export function getAuthorizationUrl(provider: OAuthProvider, state: string): string {
	const config = providerConfig[provider];

	const params = new URLSearchParams({
		client_id: config.clientId,
		redirect_uri: getRedirectUri(provider),
		response_type: 'code',
		scope: config.scopes.join(' '),
		state,
	});

	// google-specific params
	if (provider === 'google') {
		params.set('access_type', 'offline');
		params.set('prompt', 'consent');
	}

	// apple-specific params
	if (provider === 'apple') {
		params.set('response_mode', 'form_post');
	}

	return `${config.authorizeUrl}?${params.toString()}`;
}

// exchanges an issued authorization code for tokens
export async function exchangeCode(provider: OAuthProvider, code: string): Promise<OAuthTokens> {
	const config = providerConfig[provider];

	const body = new URLSearchParams({
		client_id: config.clientId,
		client_secret: config.clientSecret,
		code,
		grant_type: 'authorization_code',
		redirect_uri: getRedirectUri(provider),
	});

	const response = await fetch(config.tokenUrl, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body,
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Token exchange failed: ${text}`);
	}

	const data = await response.json();

	return {
		accessToken: data.access_token,
		idToken: data.id_token || null,
	};
}

// fetches standardized user profile from the provider
export async function getProfile(
	provider: OAuthProvider,
	tokens: OAuthTokens
): Promise<OAuthProfile> {
	if (provider === 'google') {
		return getGoogleProfile(tokens);
	}

	throw new Error(`Provider ${provider} is not yet supported.`);
}

async function getGoogleProfile(tokens: OAuthTokens): Promise<OAuthProfile> {
	const config = providerConfig.google;

	const response = await fetch(config.userinfoUrl, {
		headers: { Authorization: `Bearer ${tokens.accessToken}` },
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Failed to fetch Google profile: ${text}`);
	}

	const data = await response.json();

	return {
		provider: 'google',
		providerUserId: data.sub,
		email: data.email,
		name: data.name || null,
		avatarUrl: data.picture || null,
	};
}

// callback flow:
// 1. verify CSRF — compare state param token against the cookie we set during initiation
// 2. exchange the authorization code for access + id tokens via the provider's token endpoint
// 3. fetch the user's profile (email, name, provider id) using the tokens
// 4. look up existing oauth link — if found, this is a returning user, just log them in
// 5. if no link, check if an existing user has this email — if so, auto-link and log in
// 6. if no link and no existing user, register a new user (consuming invite code from state)
// 7. issue a jwt session cookie
// 8. redirect to /onboarding (new user) or / (returning/linked user)
export async function handleCallback(
	provider: OAuthProvider,
	code: string,
	stateParam: string,
	cookies: any
) {
	const { authRepo, oauthRepo, userRepo } = await import('./auth');

	// verify CSRF state
	const storedToken = cookies.get('oauth_state');
	if (!storedToken) throw new Error('Missing OAuth state cookie.');

	const { token, inviteCode } = parseOAuthState(stateParam);
	if (token !== storedToken) throw new Error('Invalid OAuth state.');

	// clear state cookie
	cookies.delete('oauth_state', { path: '/' });

	// exchange code for tokens and fetch profile
	const tokens = await exchangeCode(provider, code);
	const profile = await getProfile(provider, tokens);

	// check if this oauth account is already linked
	const existingOAuth = await oauthRepo.findByOAuthAccount(
		profile.provider,
		profile.providerUserId
	);

	let user;

	if (existingOAuth.status === 'success' && existingOAuth.data) {
		// returning oauth user — just log in
		user = existingOAuth.data;
	} else {
		// check if an existing user has this email (auto-link)
		const existingUser = await userRepo.findByEmail(profile.email);

		if (existingUser.status === 'success' && existingUser.data) {
			// existing password user — link oauth account and log in
			await oauthRepo.linkOAuthAccount(
				existingUser.data.userId,
				profile.provider,
				profile.providerUserId
			);
			user = existingUser.data;
		} else {
			// entirely new user — register
			const result = await oauthRepo.registerOAuth(profile, inviteCode);

			if (result.status === 'error') {
				const params = new URLSearchParams({ error: result.error || 'Registration failed.' });
				throw redirect(StatusCodes.TEMPORARY_REDIRECT, `/signup?${params}`);
			}

			user = result.data!;
		}
	}

	// issue JWT session
	const userToken = await authRepo.signToken(user);
	cookies.set('userToken', userToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 60 * 24 * 7,
	});

	// redirect based on onboarding status
	if (user.needsOnboarding === 1) {
		throw redirect(StatusCodes.TEMPORARY_REDIRECT, '/onboarding');
	}

	throw redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
}
