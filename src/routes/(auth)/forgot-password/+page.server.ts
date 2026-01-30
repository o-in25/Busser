import { fail } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { requestPasswordReset } from '$lib/server/user';

import type { PageServerLoad } from './$types';

export const load = (async () => {
	return {};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email')?.toString().trim() || '';

		// Validate email
		if (!email) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Email is required.',
				email,
			});
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Please enter a valid email address.',
				email,
			});
		}

		const result = await requestPasswordReset(email);

		if (result.status === 'error') {
			return fail(StatusCodes.INTERNAL_SERVER_ERROR, {
				error: result.error,
				email,
			});
		}

		// Always show success message (don't reveal if email exists)
		return {
			success: true,
			email,
		};
	},
};
