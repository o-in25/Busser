import { redirect } from '@sveltejs/kit';
import { generateState, generateCodeVerifier } from 'arctic';
import { StatusCodes } from 'http-status-codes';

import { dev } from '$app/environment';
import { google } from '$lib/server/providers/google';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	const state = generateState();
	const codeVerifier = generateCodeVerifier();

	const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

	cookies.set('oauth_state', state, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 10,
	});

	cookies.set('oauth_code_verifier', codeVerifier, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: 60 * 10,
	});

	return redirect(StatusCodes.TEMPORARY_REDIRECT, url.toString());
};
