import { error } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { hasGlobalPermission } from '$lib/server/auth';
import { getUsers, getUsersInOwnedWorkspaces } from '$lib/server/user';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
			code: StatusCodes.UNAUTHORIZED,
			message: 'Authentication required.',
		});
	}

	// require view_admin permission
	if (!hasGlobalPermission(locals.user, 'view_admin')) {
		error(StatusCodes.FORBIDDEN, {
			reason: getReasonPhrase(StatusCodes.FORBIDDEN),
			code: StatusCodes.FORBIDDEN,
			message: 'You do not have permission to access this resource.',
		});
	}

	// admins with edit_admin can see all users, otherwise scope to owned workspaces
	const isAdmin = hasGlobalPermission(locals.user, 'edit_admin');
	const users = isAdmin ? await getUsers() : await getUsersInOwnedWorkspaces(locals.user.userId);
	return { args: users };
};
