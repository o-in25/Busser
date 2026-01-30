import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { canModifyWorkspace } from '$lib/server/auth';
import { catalogRepo } from '$lib/server/core';

import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const workspaceId = locals.activeWorkspaceId;
	if (!workspaceId || !locals.user) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: 'Unauthorized',
			code: StatusCodes.UNAUTHORIZED,
			message: 'Workspace context required',
		});
	}

	const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
	if (!canModify) {
		error(StatusCodes.FORBIDDEN, {
			reason: 'Forbidden',
			code: StatusCodes.FORBIDDEN,
			message: 'You need editor or owner access to delete recipes.',
		});
	}

	const { recipeId } = params;
	if (!recipeId || isNaN(Number(recipeId))) {
		return json({
			error: 'No catalog item found for ID.',
		});
	}

	const result = await catalogRepo.delete(workspaceId, Number(recipeId));
	return json(result);
};
