import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { createWorkspace } from '$lib/server/workspace';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.userId;
	if (!userId) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: 'Unauthorized',
			code: StatusCodes.UNAUTHORIZED,
			message: 'Authentication required',
		});
	}

	const { workspaceName, workspaceType } = await request.json();
	const name = workspaceName?.toString().trim();

	if (!name) {
		error(StatusCodes.BAD_REQUEST, {
			reason: 'Bad Request',
			code: StatusCodes.BAD_REQUEST,
			message: 'Workspace name is required',
		});
	}

	if (!workspaceType || !['personal', 'shared'].includes(workspaceType)) {
		error(StatusCodes.BAD_REQUEST, {
			reason: 'Bad Request',
			code: StatusCodes.BAD_REQUEST,
			message: 'Invalid workspace type',
		});
	}

	const result = await createWorkspace(userId, name, workspaceType);
	if (result.status === 'error') {
		error(StatusCodes.BAD_REQUEST, {
			reason: 'Bad Request',
			code: StatusCodes.BAD_REQUEST,
			message: result.error,
		});
	}

	return json({ status: 'success', workspace: result.data });
};
