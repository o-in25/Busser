import { error, json } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { canModifyWorkspace } from '$lib/server/auth';
import { inventoryRepo } from '$lib/server/core';

import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, params }) => {
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

	if (!params?.productId) {
		error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'Inventory item not found.',
		});
	}

	const productId = Number(params.productId);

	if (isNaN(productId)) {
		return json({
			error: { message: 'Invalid or malformed inventory ID.' },
		});
	}

	const result = await inventoryRepo.toggleInStockQuantity(workspaceId, productId);
	return json(result);
};
