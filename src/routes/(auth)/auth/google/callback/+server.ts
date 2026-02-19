import { redirect } from '@sveltejs/kit';
import { OAuth2RequestError } from 'arctic';
import { StatusCodes } from 'http-status-codes';

import { dev } from '$app/environment';
import { handleOAuthCallback, resolvePostLoginRedirect } from '$lib/server/oauth';
import { google, getProfile } from '$lib/server/providers/google';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	const storedState = cookies.get('oauth_state');
	const codeVerifier = cookies.get('oauth_code_verifier');

	// clean up oauth cookies
	cookies.delete('oauth_state', { path: '/' });
	cookies.delete('oauth_code_verifier', { path: '/' });

	if (!code || !state || !storedState || state !== storedState || !codeVerifier) {
		return redirect(
			StatusCodes.TEMPORARY_REDIRECT,
			'/login?error=' + encodeURIComponent('Please try again.')
		);
	}

	try {
		const tokens = await google.validateAuthorizationCode(code, codeVerifier);
		const idToken = tokens.idToken();
		const profile = getProfile(idToken);

		const result = await handleOAuthCallback('google', profile);

		if ('error' in result) {
			return redirect(
				StatusCodes.TEMPORARY_REDIRECT,
				'/login?error=' + encodeURIComponent(result.error)
			);
		}

		cookies.set('userToken', result.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 7,
		});

		const { verifyToken } = await import('$lib/server/auth');
		const decoded = await verifyToken<{ userId: string }>(result.token);

		if (decoded?.userId) {
			const redirectPath = await resolvePostLoginRedirect(decoded.userId, cookies);
			return redirect(StatusCodes.TEMPORARY_REDIRECT, redirectPath);
		}

		return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	} catch (error) {
		console.error('Google OAuth callback error:', error);

		if (error instanceof OAuth2RequestError) {
			return redirect(
				StatusCodes.TEMPORARY_REDIRECT,
				'/login?error=' + encodeURIComponent('Authentication failed. Please try again.')
			);
		}

		throw error;
	}
};
