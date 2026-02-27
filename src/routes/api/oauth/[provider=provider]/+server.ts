import { redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { isInviteOnly } from '$lib/server/auth';
import { getAuthorizationUrl, generateOAuthState, parseOAuthState } from '$lib/server/oauth';
import { getInvitationByCode } from '$lib/server/user';
import type { OAuthProvider } from '$lib/types';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, cookies, url }) => {
	const provider = params.provider as OAuthProvider;
	const inviteCode = url.searchParams.get('invite') || null;

	const inviteOnly = await isInviteOnly();

	// if invite-only, require and validate the invite code before redirecting
	if (inviteOnly) {
		if (!inviteCode) {
			const params = new URLSearchParams({ error: 'Invitation code is required.' });
			redirect(StatusCodes.TEMPORARY_REDIRECT, `/signup?${params}`);
		}

		const result = await getInvitationByCode(inviteCode);
		if (result.status === 'error' || !result.data) {
			const params = new URLSearchParams({ error: 'Invalid invitation code.' });
			redirect(StatusCodes.TEMPORARY_REDIRECT, `/signup?${params}`);
		}

		const invitation = result.data;
		if (invitation.userId !== null) {
			const params = new URLSearchParams({ error: 'Invitation code has already been used.' });
			redirect(StatusCodes.TEMPORARY_REDIRECT, `/signup?${params}`);
		}
	}

	// generate state with CSRF token and optional invite code
	const state = generateOAuthState(inviteCode);
	const { token } = parseOAuthState(state);

	// store CSRF token in a short-lived cookie for verification in the callback
	cookies.set('oauth_state', token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 60 * 10,
	});

	const authUrl = getAuthorizationUrl(provider, state);
	redirect(StatusCodes.TEMPORARY_REDIRECT, authUrl);
};
