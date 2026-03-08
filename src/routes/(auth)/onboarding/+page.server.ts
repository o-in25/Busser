import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { dev } from '$app/environment';
import { signToken } from '$lib/server/auth';
import { completeOnboarding } from '$lib/server/oauth';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.needsOnboarding !== 1) {
		redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	}

	return { email: locals.user.email };
};

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		if (!locals.user || locals.user.needsOnboarding !== 1) {
			redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
		}

		const formData = Object.fromEntries(await request.formData());
		const username = (formData.username as string)?.trim();

		let errors = {
			username: { hasError: false, message: '' },
		};

		if (!username) {
			errors.username = { hasError: true, message: 'Username is required.' };
			return fail(StatusCodes.BAD_REQUEST, { errors, message: '' });
		}

		const result = await completeOnboarding(locals.user.userId, username);

		if (result.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, { errors, message: result.error });
		}

		// re-issue JWT with updated user data
		const updatedUser = { ...locals.user, username, needsOnboarding: 0 };
		const userToken = await signToken(updatedUser);
		cookies.set('userToken', userToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 7,
		});

		redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	},
};
