import { error, redirect } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import micromatch from 'micromatch';

import { getWorkspace } from '$lib/server/auth';

import type { LayoutServerLoad } from './$types';

const GLOBAL_WORKSPACE_ID = 'ws-global-catalog';

// routes within (workspace) that can be accessed without auth
const publicWorkspaceRoutes = ['/catalog/**', '/tools/**', '/inventory', '/assistant'];

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const isPublicRoute = micromatch.isMatch(url.pathname, publicWorkspaceRoutes);

	// unauthenticated users get a read-only global workspace for public routes
	if (!locals.user) {
		if (isPublicRoute) {
			return {
				workspace: {
					workspaceId: GLOBAL_WORKSPACE_ID,
					workspaceName: 'Global Recipe Catalog',
					workspaceType: 'shared' as const,
					workspaceRole: 'viewer' as const,
				},
			};
		}

		error(StatusCodes.UNAUTHORIZED, {
			reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
			code: StatusCodes.UNAUTHORIZED,
			message: 'You do not have permission to access this resource.',
		});
	}

	// Get workspace from locals (set by hooks)
	const workspaceId = locals.activeWorkspaceId;

	if (!workspaceId) {
		// public routes fall back to global workspace if no workspace selected
		if (isPublicRoute) {
			return {
				workspace: {
					workspaceId: GLOBAL_WORKSPACE_ID,
					workspaceName: 'Global Recipe Catalog',
					workspaceType: 'shared' as const,
					workspaceRole: 'viewer' as const,
				},
			};
		}
		redirect(StatusCodes.TEMPORARY_REDIRECT, '/workspace/select');
	}

	const result = await getWorkspace(locals.user.userId, workspaceId);

	if (result.status === 'error' || !result.data) {
		error(StatusCodes.FORBIDDEN, {
			reason: getReasonPhrase(StatusCodes.FORBIDDEN),
			code: StatusCodes.FORBIDDEN,
			message: 'You do not have permission to access this workspace.',
		});
	}

	return {
		workspace: {
			workspaceId: result.data.workspaceId,
			workspaceName: result.data.workspaceName,
			workspaceType: result.data.workspaceType,
			workspaceRole: result.data.workspaceRole,
		},
	};
};
