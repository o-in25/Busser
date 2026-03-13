import { error, fail } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import {
	createWorkspace,
	deleteWorkspace,
	getUserWorkspaces,
	isWorkspaceOwner,
	updateWorkspace,
} from '$lib/server/auth';
import { getPreferredWorkspaceId, setPreferredWorkspaceId } from '$lib/server/user';

import type { Actions, PageServerLoad } from './$types';

const GLOBAL_WORKSPACE_ID = 'ws-global-catalog';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
			code: StatusCodes.UNAUTHORIZED,
			message: 'Authentication required.',
		});
	}

	// fetch only workspaces the user belongs to
	const result = await getUserWorkspaces(locals.user.userId);

	// get current workspace ID from locals (set by hooks) or fall back to query param
	const currentWorkspaceId = locals.activeWorkspaceId || url.searchParams.get('from') || null;

	// get preferred workspace ID from DB
	const preferredWorkspaceId = await getPreferredWorkspaceId(locals.user.userId);

	if (result.status === 'error') {
		return { workspaces: [], currentWorkspaceId, preferredWorkspaceId, error: result.error };
	}

	return { workspaces: result.data || [], currentWorkspaceId, preferredWorkspaceId };
};

export const actions: Actions = {
	create: async ({ locals, request }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, {
				error: 'Authentication required.',
			});
		}

		const formData = await request.formData();
		const workspaceName = formData.get('workspaceName')?.toString().trim();
		const workspaceType = formData.get('workspaceType')?.toString() as 'personal' | 'shared';

		if (!workspaceName) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Workspace name is required.',
			});
		}

		if (!workspaceType || !['personal', 'shared'].includes(workspaceType)) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Invalid workspace type.',
			});
		}

		const result = await createWorkspace(locals.user.userId, workspaceName, workspaceType);

		if (result.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, {
				error: result.error,
			});
		}

		return { success: true, workspace: result.data };
	},

	update: async ({ locals, request, url }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, {
				error: 'Authentication required.',
			});
		}

		const formData = await request.formData();
		const workspaceId = formData.get('workspaceId')?.toString();
		const workspaceName = formData.get('workspaceName')?.toString().trim();
		const workspaceType = formData.get('workspaceType')?.toString() as 'personal' | 'shared';
		const currentWorkspaceId = locals.activeWorkspaceId || url.searchParams.get('from') || null;

		if (!workspaceId) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Workspace ID is required.',
			});
		}

		// prevent editing the global workspace
		if (workspaceId === GLOBAL_WORKSPACE_ID) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'The global workspace cannot be modified.',
			});
		}

		// prevent editing the current workspace
		if (currentWorkspaceId && workspaceId === currentWorkspaceId) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'You cannot modify the workspace you are currently in.',
			});
		}

		// only workspace owners can update workspace settings
		const isOwner = await isWorkspaceOwner(locals.user.userId, workspaceId);
		if (!isOwner) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'Only workspace owners can modify workspace settings.',
			});
		}

		if (!workspaceName) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Workspace name is required.',
			});
		}

		if (!workspaceType || !['personal', 'shared'].includes(workspaceType)) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Invalid workspace type.',
			});
		}

		const result = await updateWorkspace(workspaceId, workspaceName, workspaceType);

		if (result.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, {
				error: result.error,
			});
		}

		return { success: true, workspace: result.data };
	},

	setPreferredWorkspace: async ({ locals, request, cookies }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const workspaceId = formData.get('workspaceId')?.toString() || null;

		// allow clearing preferred workspace
		if (!workspaceId) {
			await setPreferredWorkspaceId(locals.user.userId, null);
			return { success: true };
		}

		// verify user has access to this workspace
		const workspacesResult = await getUserWorkspaces(locals.user.userId);
		const workspaces = workspacesResult.status === 'success' ? workspacesResult.data || [] : [];
		const selectedWorkspace = workspaces.find((w) => w.workspaceId === workspaceId);

		if (!selectedWorkspace) {
			return fail(StatusCodes.FORBIDDEN, { error: 'You do not have access to this workspace' });
		}

		await setPreferredWorkspaceId(locals.user.userId, workspaceId);

		// also update the cookie
		cookies.set('activeWorkspaceId', workspaceId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 365,
		});

		return { success: true };
	},

	delete: async ({ locals, request, url }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, {
				error: 'Authentication required.',
			});
		}

		const formData = await request.formData();
		const workspaceId = formData.get('workspaceId')?.toString();
		const currentWorkspaceId = locals.activeWorkspaceId || url.searchParams.get('from') || null;

		if (!workspaceId) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Workspace ID is required.',
			});
		}

		// prevent deletion of the global workspace
		if (workspaceId === GLOBAL_WORKSPACE_ID) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'The global workspace cannot be deleted.',
			});
		}

		// prevent deleting the current workspace
		if (currentWorkspaceId && workspaceId === currentWorkspaceId) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'You cannot delete the workspace you are currently in.',
			});
		}

		// only workspace owners can delete workspaces
		const isOwner = await isWorkspaceOwner(locals.user.userId, workspaceId);
		if (!isOwner) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'Only workspace owners can delete workspaces.',
			});
		}

		const result = await deleteWorkspace(workspaceId);

		if (result.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, {
				error: result.error,
			});
		}

		return { success: true, deleted: workspaceId };
	},
};
