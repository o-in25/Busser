import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { getInvitationByCode, registerUser } from '$lib/server/user';

import type { PageServerLoad } from './$types';

export const load = (async ({ url, locals }) => {
	// if user is already logged in, redirect to home
	if (locals.user?.userId) {
		redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	}

	const code = url.searchParams.get('code');

	// if no code, just show the signup page
	if (!code) {
		return { invitationCode: null, existingUserEmail: null };
	}

	// look up the invitation
	const invitationResult = await getInvitationByCode(code);

	if (invitationResult.status === 'error' || !invitationResult.data) {
		return { invitationCode: code, existingUserEmail: null };
	}

	const invitation = invitationResult.data;

	// if this is a workspace invitation, redirect to the accept page
	if (invitation.workspaceId && invitation.workspaceRole) {
		redirect(StatusCodes.TEMPORARY_REDIRECT, `/accept-invite?code=${code}`);
	}

	return { invitationCode: code, existingUserEmail: null };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request }) => {
		let formData: any = await request.formData();
		formData = Object.fromEntries(formData);

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
			invitationCode: {
				hasError: false,
				message: '',
			},
		};

		const validateForm = ({ username, password, passwordConfirm, email, invitationCode }) => {
			if (!username?.trim()) {
				errors.username = {
					hasError: true,
					message: 'Username is required.',
				};
			}

			if (!password?.trim()) {
				errors.password = {
					hasError: true,
					message: 'Password is required.',
				};
			}

			if (!passwordConfirm?.trim()) {
				errors.passwordConfirm = {
					hasError: true,
					message: 'Password confirmation is required.',
				};
			}

			if (password !== passwordConfirm) {
				errors.password = {
					hasError: true,
					message: 'Passwords do not match.',
				};
				errors.passwordConfirm = {
					hasError: true,
					message: 'Passwords do not match.',
				};
			}

			if (!email?.trim()) {
				errors.email = {
					hasError: true,
					message: 'Email is required.',
				};
			} else {
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				if (!emailRegex.test(email)) {
					errors.email = {
						hasError: true,
						message: 'Email is not valid.',
					};
				}
			}

			if (!invitationCode?.trim()) {
				errors.invitationCode = {
					hasError: true,
					message: 'Invitation code is required.',
				};
			}

			const valid = !Object.values(errors).some((field) => field.hasError);
			return { valid, errors };
		};

		const { valid, errors: formErrors } = validateForm(formData);

		if (!valid) {
			return fail(StatusCodes.BAD_REQUEST, {
				errors: formErrors,
				message: '',
			});
		}

		const queryResult = await registerUser(
			formData.username,
			formData.email,
			formData.password,
			formData.invitationCode
		);
		if (queryResult.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, {
				errors: formErrors,
				message: queryResult.error,
			});
		}

		const params = new URLSearchParams({
			email: formData.email,
		});
		const url = `/verify-email?${params.toString()}`;

		return redirect(StatusCodes.TEMPORARY_REDIRECT, url);
	},
};
