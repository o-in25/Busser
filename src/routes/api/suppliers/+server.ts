import { error, json } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { canModifyWorkspace } from '$lib/server/auth';
import { inventoryRepo } from '$lib/server/core';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const workspaceId = locals.activeWorkspaceId;
	if (!workspaceId || !locals.user) {
		error(StatusCodes.UNAUTHORIZED, { reason: 'Unauthorized', code: StatusCodes.UNAUTHORIZED, message: 'Workspace context required' });
	}

	const suppliers = await inventoryRepo.getSuppliers(workspaceId);
	return json(suppliers);
};

export const POST: RequestHandler = async ({ locals, request }) => {
	const workspaceId = locals.activeWorkspaceId;
	if (!workspaceId || !locals.user) {
		error(StatusCodes.UNAUTHORIZED, { reason: 'Unauthorized', code: StatusCodes.UNAUTHORIZED, message: 'Workspace context required' });
	}

	const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
	if (!canModify) {
		error(StatusCodes.FORBIDDEN, { reason: getReasonPhrase(StatusCodes.FORBIDDEN), code: StatusCodes.FORBIDDEN, message: 'You need editor or owner access to add suppliers.' });
	}

	const body = await request.json();
	const result = await inventoryRepo.createSupplier(workspaceId, {
		supplierName: body.name,
		supplierDetails: body.details || null,
		supplierWebsiteUrl: body.website || null,
		supplierPhone: body.phone || null,
		supplierAddress: body.address || null,
		supplierPlaceId: body.placeId || null,
		supplierType: body.type || 'liquor_store',
	});

	if (result.status === 'error') {
		error(StatusCodes.INTERNAL_SERVER_ERROR, { reason: 'Server Error', code: StatusCodes.INTERNAL_SERVER_ERROR, message: result.error });
	}

	return json(result.data, { status: 201 });
};

export const DELETE: RequestHandler = async ({ locals, url }) => {
	const workspaceId = locals.activeWorkspaceId;
	if (!workspaceId || !locals.user) {
		error(StatusCodes.UNAUTHORIZED, { reason: 'Unauthorized', code: StatusCodes.UNAUTHORIZED, message: 'Workspace context required' });
	}

	const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
	if (!canModify) {
		error(StatusCodes.FORBIDDEN, { reason: getReasonPhrase(StatusCodes.FORBIDDEN), code: StatusCodes.FORBIDDEN, message: 'You need editor or owner access to remove suppliers.' });
	}

	const supplierId = Number(url.searchParams.get('id'));
	if (!supplierId || isNaN(supplierId)) {
		error(StatusCodes.BAD_REQUEST, { reason: 'Bad Request', code: StatusCodes.BAD_REQUEST, message: 'Supplier ID is required.' });
	}

	const result = await inventoryRepo.deleteSupplier(workspaceId, supplierId);
	if (result.status === 'error') {
		error(StatusCodes.BAD_REQUEST, { reason: 'Bad Request', code: StatusCodes.BAD_REQUEST, message: result.error });
	}

	return json({ deleted: result.data });
};
