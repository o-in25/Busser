import { error, fail, redirect } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { getUserWorkspaces, hasGlobalPermission, oauthRepo } from '$lib/server/auth';
import { deleteUser, getUser } from '$lib/server/user';

import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	const userId = locals.user?.userId || '';
	const queryResult = await getUser(userId);
	if (queryResult.status === 'error') {
		return error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'User not found.',
		});
	}

	const user = queryResult.data;

	// load user's workspaces
	const workspacesResult = await getUserWorkspaces(userId);
	const workspaces = workspacesResult.status === 'success' ? workspacesResult.data || [] : [];

	// get current workspace ID from locals (set by hooks) or fall back to query param
	const currentWorkspaceId = locals.activeWorkspaceId || url.searchParams.get('from') || null;
	const currentWorkspace = currentWorkspaceId
		? workspaces.find((w) => w.workspaceId === currentWorkspaceId) || null
		: null;

	// load linked oauth accounts
	const linkedAccountsResult = await oauthRepo.getLinkedAccounts(userId);
	const linkedAccounts = linkedAccountsResult.status === 'success' ? linkedAccountsResult.data || [] : [];

	return { user, workspaces, currentWorkspace, linkedAccounts };
}) satisfies PageServerLoad;

export const actions: Actions = {
	unlinkAccount: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const provider = formData.get('provider')?.toString();

		if (!provider) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Provider is required' });
		}

		const result = await oauthRepo.unlinkOAuthAccount(locals.user.userId, provider);

		if (result.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, { error: result.error });
		}

		return { success: true, unlinked: provider };
	},

	deleteAccount: async ({ locals, cookies }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Not authenticated' });
		}

		// prevent users with admin permissions from deleting their own account
		if (hasGlobalPermission(locals.user, 'delete_admin')) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'Administrators cannot delete their own account',
			});
		}

		const result = await deleteUser(locals.user.userId);
		if (result.error) {
			return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: 'Failed to delete account' });
		}

		// clear auth cookie
		cookies.delete('userToken', { path: '/' });
		cookies.delete('activeWorkspaceId', { path: '/' });

		return redirect(StatusCodes.SEE_OTHER, '/');
	},
};
