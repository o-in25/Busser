import { redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';
import { handleCallback } from '$lib/server/oauth';
import type { OAuthProvider } from '$lib/types';
import type { RequestHandler } from './$types';

// google callback: GET with ?code= and ?state=
export const GET: RequestHandler = async ({ params, url, cookies }) => {
	const provider = params.provider as OAuthProvider;
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	if (!code || !state) {
		const error = url.searchParams.get('error') || 'Missing authorization code.';
		const params = new URLSearchParams({ error });
		throw redirect(StatusCodes.TEMPORARY_REDIRECT, `/signup?${params}`);
	}

	try {
		await handleCallback(provider, code, state, cookies);
	} catch (err) {
		// re-throw redirects
		if (err && typeof err === 'object' && 'status' in err) throw err;

		console.error('OAuth callback error:', err);
		const params = new URLSearchParams({ error: 'Authentication failed. Please try again.' });
		redirect(StatusCodes.TEMPORARY_REDIRECT, `/signup?${params}`);
	}
	return new Response(null, { status: StatusCodes.TEMPORARY_REDIRECT });
};

// apple callback: POST with form-encoded body
export const POST: RequestHandler = async ({ params, request, cookies }) => {
	const provider = params.provider as OAuthProvider;
	const formData = await request.formData();
	const code = formData.get('code')?.toString();
	const state = formData.get('state')?.toString();

	if (!code || !state) {
		const error = 'Missing authorization code.';
		const params = new URLSearchParams({ error });
		redirect(StatusCodes.TEMPORARY_REDIRECT, `/signup?${params}`);
	}

	try {
		await handleCallback(provider, code, state, cookies);
	} catch (err) {
		if (err && typeof err === 'object' && 'status' in err) throw err;

		console.error('OAuth callback error:', err);
		const params = new URLSearchParams({ error: 'Authentication failed. Please try again.' });
		redirect(StatusCodes.TEMPORARY_REDIRECT, `/signup?${params}`);
	}
	return new Response(null, { status: StatusCodes.TEMPORARY_REDIRECT });
};
