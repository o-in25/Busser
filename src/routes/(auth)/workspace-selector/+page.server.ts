import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { getUserWorkspaces } from '$lib/server/auth';
import { setPreferredWorkspaceId } from '$lib/server/user';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	// Must be logged in
	if (!locals.user) {
		redirect(StatusCodes.TEMPORARY_REDIRECT, '/login');
	}

	const { userId } = locals.user;

	// Get user's workspaces
	const workspacesResult = await getUserWorkspaces(userId);
	const workspaces = workspacesResult.status === 'success' ? workspacesResult.data || [] : [];

	// If user has no workspaces, show empty state
	if (workspaces.length === 0) {
		return { workspaces: [], hasNoWorkspaces: true };
	}

	// If user has exactly 1 workspace, auto-select it and redirect
	if (workspaces.length === 1) {
		const workspace = workspaces[0];

		// Set the cookie
		cookies.set('activeWorkspaceId', workspace.workspaceId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 365, // 1 year
		});

		// Auto-set as preferred in DB for single workspace users
		await setPreferredWorkspaceId(userId, workspace.workspaceId);

		redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	}

	// User has multiple workspaces - show selector
	return { workspaces, hasNoWorkspaces: false };
};

export const actions: Actions = {
	select: async ({ locals, request, cookies }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const workspaceId = formData.get('workspaceId')?.toString();
		const setAsDefault = formData.get('setAsDefault') === 'true';

		if (!workspaceId) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Please select a workspace' });
		}

		// Verify user has access to this workspace
		const workspacesResult = await getUserWorkspaces(locals.user.userId);
		const workspaces = workspacesResult.status === 'success' ? workspacesResult.data || [] : [];
		const selectedWorkspace = workspaces.find((w) => w.workspaceId === workspaceId);

		if (!selectedWorkspace) {
			return fail(StatusCodes.FORBIDDEN, { error: 'You do not have access to this workspace' });
		}

		// Set the active workspace cookie
		cookies.set('activeWorkspaceId', workspaceId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 365, // 1 year
		});

		// If setAsDefault is true, save to DB
		if (setAsDefault) {
			await setPreferredWorkspaceId(locals.user.userId, workspaceId);
		}

		// Redirect to home
		redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	},
};
