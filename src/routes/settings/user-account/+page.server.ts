import { error, fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { getUserWorkspaces } from '$lib/server/auth';
import { deleteUser, getPreferredWorkspaceId, getUser, setPreferredWorkspaceId } from '$lib/server/user';

import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals, url }) => {
	const userId = locals.user?.userId || '';
	const queryResult = await getUser(userId);
	if (queryResult.status === 'error') {
		return error(StatusCodes.NOT_FOUND);
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

	// get preferred workspace ID from DB
	const preferredWorkspaceId = await getPreferredWorkspaceId(userId);

	return { user, workspaces, currentWorkspace, preferredWorkspaceId };
}) satisfies PageServerLoad;

export const actions: Actions = {
	setPreferredWorkspace: async ({ locals, request, cookies }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const workspaceId = formData.get('workspaceId')?.toString();

		if (!workspaceId) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Workspace ID is required' });
		}

		// Verify user has access to this workspace
		const workspacesResult = await getUserWorkspaces(locals.user.userId);
		const workspaces = workspacesResult.status === 'success' ? workspacesResult.data || [] : [];
		const selectedWorkspace = workspaces.find((w) => w.workspaceId === workspaceId);

		if (!selectedWorkspace) {
			return fail(StatusCodes.FORBIDDEN, { error: 'You do not have access to this workspace' });
		}

		// Set preferred workspace in DB
		await setPreferredWorkspaceId(locals.user.userId, workspaceId);

		// Also update the cookie
		cookies.set('activeWorkspaceId', workspaceId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 365, // 1 year
		});

		return { success: true };
	},

	deleteAccount: async ({ locals, cookies }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Not authenticated' });
		}

		// prevent admins from deleting their own account
		const isAdmin = locals.user.roles?.some((r) => r.roleName === 'ADMIN');
		if (isAdmin) {
			return fail(StatusCodes.FORBIDDEN, { error: 'Administrators cannot delete their own account' });
		}

		const result = await deleteUser(locals.user.userId);
		if (result.status === 'error') {
			return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: 'Failed to delete account' });
		}

		// clear auth cookie
		cookies.delete('userToken', { path: '/' });
		cookies.delete('activeWorkspaceId', { path: '/' });

		return redirect(StatusCodes.SEE_OTHER, '/');
	},
};
