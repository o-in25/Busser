import { redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { verifyRegistrationToken } from '$lib/server/auth';
import { verifyUser } from '$lib/server/user';

import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const { token } = params;
	if (!token) {
		return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	}

	const queryResult = await verifyUser(token);

	// If verification failed, try to extract userId from expired token for resend
	if (queryResult.status === 'error') {
		const tokenResult = await verifyRegistrationToken(token);
		return {
			...queryResult,
			userId: tokenResult.payload?.userId || null,
		};
	}

	return queryResult;
}) satisfies PageServerLoad;
