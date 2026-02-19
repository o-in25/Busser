import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { dev } from '$app/environment';
import { login, verifyToken, resolvePostLoginRedirect } from '$lib/server/auth';
import type { User } from '$lib/types';

import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	if (locals.user?.userId) {
		return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	}
	return {
		passwordReset: url.searchParams.get('passwordReset') === 'true',
		oauthError: url.searchParams.get('error'),
	};
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, cookies }) => {
		const formData: any = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		let errors = {
			username: {
				hasError: false,
				message: '',
			},
			email: {
				hasError: false,
				message: '',
			},
			password: {
				hasError: false,
				message: '',
			},
			passwordConfirm: {
				hasError: false,
				message: '',
			},
		};

		if (!username) {
			errors = {
				...errors,
				username: {
					hasError: true,
					message: 'Invalid username.',
				},
			};
		}

		if (!password) {
			errors = {
				...errors,
				password: {
					hasError: true,
					message: 'Invalid password.',
				},
			};
		}

		if (errors.username.hasError || errors.password.hasError) {
			return fail(StatusCodes.BAD_REQUEST, {
				errors,
			});
		}

		const queryResult = await login(username, password);

		// Check if user needs verification
		if ('needsVerification' in queryResult && queryResult.needsVerification) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'error' in queryResult ? queryResult.error : 'Email verification required.',
				needsVerification: true,
				email: queryResult.email,
			});
		}

		if ('data' in queryResult && queryResult.data?.length) {
			const userToken: string = queryResult.data;

			cookies.set('userToken', userToken, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: !dev,
				maxAge: 60 * 60 * 24 * 7,
			});

			const decoded = await verifyToken<User>(userToken);
			if (decoded?.userId) {
				const redirectPath = await resolvePostLoginRedirect(decoded.userId, cookies);
				return redirect(StatusCodes.TEMPORARY_REDIRECT, redirectPath);
			}

			return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
		}

		if ('error' in queryResult) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: queryResult.error,
			});
		}
	},
} satisfies Actions;
