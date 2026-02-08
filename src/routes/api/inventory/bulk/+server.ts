import { error, json } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { canModifyWorkspace } from '$lib/server/auth';
import { inventoryRepo } from '$lib/server/core';

import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async ({ locals, request }) => {
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
			reason: getReasonPhrase(StatusCodes.FORBIDDEN),
			code: StatusCodes.FORBIDDEN,
			message: 'You need editor or owner access to delete inventory items.',
		});
	}

	const { productIds } = await request.json();
	if (!Array.isArray(productIds) || productIds.length === 0) {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'productIds must be a non-empty array.',
		});
	}

	const results = await Promise.all(
		productIds.map((id: number) => inventoryRepo.delete(workspaceId, id))
	);

	const succeeded = results.filter((r) => r.status === 'success').length;
	const failed = results.filter((r) => r.status === 'error').length;

	return json({ succeeded, failed, total: productIds.length });
};
