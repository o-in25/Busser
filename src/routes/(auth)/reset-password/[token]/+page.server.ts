import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { resetPasswordWithToken, verifyPasswordResetToken } from '$lib/server/auth';

import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
	const { token } = params;

	// Verify token on page load
	const { valid, expired, payload } = await verifyPasswordResetToken(token);

	return {
		tokenValid: valid,
		tokenExpired: expired,
		email: payload?.email || null,
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, params }) => {
		const { token } = params;
		const formData = await request.formData();
		const password = formData.get('password')?.toString() || '';
		const passwordConfirm = formData.get('passwordConfirm')?.toString() || '';

		// Validate passwords
		if (!password) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Password is required.',
			});
		}

		if (password.length < 8) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Password must be at least 8 characters long.',
			});
		}

		if (password !== passwordConfirm) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Passwords do not match.',
			});
		}

		const result = await resetPasswordWithToken(token, password);

		if (result.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, {
				error: result.error,
			});
		}

		// Redirect to login with success message
		return redirect(StatusCodes.TEMPORARY_REDIRECT, '/login?passwordReset=true');
	},
};
