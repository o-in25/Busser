import { error, json } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { canModifyWorkspace } from '$lib/server/auth';
import { inventoryRepo } from '$lib/server/core';

import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ locals, request }) => {
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
			message: 'You need editor or owner access to modify inventory items.',
		});
	}

	const { productIds, inStock } = await request.json();
	if (!Array.isArray(productIds) || productIds.length === 0) {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'productIds must be a non-empty array.',
		});
	}
	if (typeof inStock !== 'boolean') {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'inStock must be a boolean.',
		});
	}

	const result = await inventoryRepo.setStockQuantity(workspaceId, productIds, inStock ? 1 : 0);

	if (result.status === 'error') {
		error(StatusCodes.INTERNAL_SERVER_ERROR, {
			reason: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			message: result.error,
		});
	}

	return json({ updated: result.data, total: productIds.length });
};
