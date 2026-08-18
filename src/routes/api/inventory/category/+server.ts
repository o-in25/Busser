import { error, json } from '@sveltejs/kit';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

import { inventoryRepo, titleCase } from '$lib/server/core';
import { canModifyWorkspace } from '$lib/server/workspace';

import type { RequestHandler } from './$types';

// json create endpoint used by the nested category sheet (page action navigates, this does not)
export const POST: RequestHandler = async ({ request, locals }) => {
	const workspaceId = locals.activeWorkspaceId;
	if (!workspaceId || !locals.user) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
			code: StatusCodes.UNAUTHORIZED,
			message: 'Workspace context required.',
		});
	}

	const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
	if (!canModify) {
		error(StatusCodes.FORBIDDEN, {
			reason: getReasonPhrase(StatusCodes.FORBIDDEN),
			code: StatusCodes.FORBIDDEN,
			message: 'You need editor or owner access to add categories.',
		});
	}

	const body = await request.json();
	const categoryName = (body.categoryName ?? '').trim();
	if (!categoryName) {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'Category name is required.',
		});
	}

	const categoryDescription = body.categoryDescription ?? '';
	const parentCategoryId = body.parentCategoryId ? Number(body.parentCategoryId) : null;
	const categoryGroupId = body.categoryGroupId ? Number(body.categoryGroupId) : null;

	const result = await inventoryRepo.createCategory(
		workspaceId,
		categoryName,
		categoryDescription,
		parentCategoryId,
		categoryGroupId
	);
	if (result.status === 'error') {
		error(StatusCodes.CONFLICT, {
			reason: getReasonPhrase(StatusCodes.CONFLICT),
			code: StatusCodes.CONFLICT,
			message: result.error,
		});
	}

	// name is title-cased server-side; echo the canonical value so the parent display matches
	return json({ name: titleCase(categoryName), value: result.data, categoryGroupId });
};
