import { type Actions, error, fail } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import {
	forceResetPassword,
	hasGlobalPermission,
	oauthRepo,
	resetPassword,
} from '$lib/server/auth';
import { editUser, getUser, roleSelect } from '$lib/server/user';

import type { PageServerLoad } from './$types';

const load: PageServerLoad = async ({ params, locals }) => {
	const { userId } = params;
	if (
		!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_admin') &&
		userId?.length &&
		userId !== locals.user?.userId
	) {
		return error(StatusCodes.UNAUTHORIZED, {
			reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
			code: StatusCodes.UNAUTHORIZED,
			message: 'You do not have permission to access this resource.',
		});
	}
	if (!userId) {
		return error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'User not found.',
		});
	}

	const queryResult = await getUser(userId);
	const roles = await roleSelect();
	if ('data' in queryResult) {
		const hasPassword = await oauthRepo.hasPassword(userId);
		const canForceReset = hasGlobalPermission(locals.user, 'force_reset_password');
		const isSelf = locals.user?.userId === userId;
		return {
			user: queryResult.data,
			roles,
			currentUser: locals.user?.userId,
			hasPassword,
			canForceReset,
			isSelf,
		};
	}

	return error(StatusCodes.INTERNAL_SERVER_ERROR, {
		reason: getReasonPhrase(StatusCodes.NOT_FOUND),
		code: StatusCodes.NOT_FOUND,
		message: 'User not found.',
	});
};

const actions = {
	updateUser: async ({ request, params, locals }) => {
		const { userId } = params;
		const formData = await request.formData();
		const username = formData.get('username')?.toString() || '';
		const email = formData.get('email')?.toString() || '';
		const roles = formData.get('roles')?.toString() || '';
		if (
			!locals.user?.permissions
				.map(({ permissionName }) => permissionName)
				.includes('edit_admin') &&
			userId?.length &&
			userId !== locals.user?.userId
		) {
			return fail(StatusCodes.UNAUTHORIZED, {
				status: getReasonPhrase(StatusCodes.UNAUTHORIZED),
				error: 'You do not have permission to perform this action.',
			});
		}

		if (!userId) {
			return fail(StatusCodes.UNAUTHORIZED, {
				status: getReasonPhrase(StatusCodes.UNAUTHORIZED),
				error: 'User not found.',
			});
		}

		const errors = {
			username: { hasError: false, message: '' },
			email: { hasError: false, message: '' },
		};

		if (!username.trim()) {
			errors.username = { hasError: true, message: 'Username is required.' };
		}

		if (!email.trim()) {
			errors.email = { hasError: true, message: 'Email is required.' };
		} else {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				errors.email = { hasError: true, message: 'Email is not valid.' };
			}
		}

		const hasErrors = Object.values(errors).some((field) => field.hasError);
		if (hasErrors) {
			return fail(StatusCodes.BAD_REQUEST, { errors });
		}

		let roleIds: string[] = [];
		if (
			locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_admin') &&
			userId !== locals.user?.userId
		) {
			roleIds = roles?.split(',') || [];
		}

		const queryResult = await editUser(userId, username, email, roleIds);
		if ('data' in queryResult) {
			return {
				user: queryResult.data,
			};
		}
	},

	resetPassword: async ({ request, params, locals }) => {
		const { userId } = params;
		if (!userId) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'User not found.' });
		}

		const isSelf = locals.user?.userId === userId;
		const isAdmin = locals.user?.permissions
			?.map(({ permissionName }) => permissionName)
			.includes('edit_admin');
		const canForceReset = hasGlobalPermission(locals.user, 'force_reset_password');

		// must be either self or admin
		if (!isSelf && !isAdmin) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Not authorized.' });
		}

		const formData = await request.formData();
		const oldPassword = formData.get('oldPassword')?.toString() || '';
		const newPassword = formData.get('newPassword')?.toString() || '';
		const confirmPassword = formData.get('confirmPassword')?.toString() || '';

		if (!newPassword || newPassword.length < 8) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Password must be at least 8 characters.' });
		}

		if (newPassword !== confirmPassword) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Passwords do not match.' });
		}

		// admin force reset (no old password) or self with no existing password
		const hasPassword = await oauthRepo.hasPassword(userId);
		if (canForceReset && !isSelf) {
			const success = await forceResetPassword(userId, newPassword);
			if (!success) {
				return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: 'Failed to reset password.' });
			}
		} else if (!hasPassword) {
			// oauth user setting password for first time
			const success = await forceResetPassword(userId, newPassword);
			if (!success) {
				return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: 'Failed to set password.' });
			}
		} else {
			// self reset — requires old password
			if (!oldPassword) {
				return fail(StatusCodes.BAD_REQUEST, { error: 'Current password is required.' });
			}
			const success = await resetPassword(userId, oldPassword, newPassword);
			if (!success) {
				return fail(StatusCodes.BAD_REQUEST, { error: 'Current password is incorrect.' });
			}
		}

		return { passwordChanged: true };
	},
} satisfies Actions;

export { actions, load };
