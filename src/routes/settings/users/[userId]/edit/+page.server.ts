import { type Actions, error, fail } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { forceResetPassword, oauthRepo } from '$lib/server/auth';
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

	// let user = await db.table<User>('user').where({ userId }).first();
	// user = Object.assign({}, user);
	const queryResult = await getUser(userId);
	const roles = await roleSelect();
	if ('data' in queryResult) {
		const hasPassword = await oauthRepo.hasPassword(userId);
		return { user: queryResult.data, roles, currentUser: locals.user?.userId, hasPassword };
	}

	return error(StatusCodes.INTERNAL_SERVER_ERROR, {
		reason: getReasonPhrase(StatusCodes.NOT_FOUND),
		code: StatusCodes.NOT_FOUND,
		message: 'User not found.',
	});
};

const actions = {
	default: async ({ request, params, locals }) => {
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

	setPassword: async ({ request, params, locals }) => {
		const { userId } = params;

		if (!locals.user || !userId || locals.user.userId !== userId) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Not authorized.' });
		}

		// only allow setting password for users who don't have one
		const hasPassword = await oauthRepo.hasPassword(userId);
		if (hasPassword) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'You already have a password set.' });
		}

		const formData = await request.formData();
		const newPassword = formData.get('newPassword')?.toString() || '';
		const confirmPassword = formData.get('confirmPassword')?.toString() || '';

		if (!newPassword || newPassword.length < 8) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Password must be at least 8 characters.' });
		}

		if (newPassword !== confirmPassword) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Passwords do not match.' });
		}

		const success = await forceResetPassword(userId, newPassword);
		if (!success) {
			return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: 'Failed to set password.' });
		}

		return { passwordSet: true };
	},
} satisfies Actions;

export { actions, load };
