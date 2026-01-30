import { error, redirect } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { getWorkspace } from '$lib/server/auth';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
			code: StatusCodes.UNAUTHORIZED,
			message: 'You do not have permission to access this resource.',
		});
	}

	// Get workspace from locals (set by hooks)
	const workspaceId = locals.activeWorkspaceId;

	if (!workspaceId) {
		// Should be handled by hooks, but just in case
		redirect(StatusCodes.TEMPORARY_REDIRECT, '/workspace-selector');
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
