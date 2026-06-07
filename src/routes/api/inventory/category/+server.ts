import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { inventoryRepo, titleCase } from '$lib/server/core';
import { canModifyWorkspace } from '$lib/server/workspace';

import type { RequestHandler } from './$types';

// json create endpoint used by the nested category sheet (page action navigates, this does not)
export const POST: RequestHandler = async ({ request, locals }) => {
	const workspaceId = locals.activeWorkspaceId;
	if (!workspaceId || !locals.user) {
		error(StatusCodes.UNAUTHORIZED, 'Workspace context required.');
	}

	const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
	if (!canModify) {
		error(StatusCodes.FORBIDDEN, 'You need editor or owner access to add categories.');
	}

	const body = await request.json();
	const categoryName = (body.categoryName ?? '').trim();
	if (!categoryName) {
		error(StatusCodes.BAD_REQUEST, 'Category name is required.');
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
		error(StatusCodes.CONFLICT, result.error);
	}

	// name is title-cased server-side; echo the canonical value so the parent display matches
	return json({ name: titleCase(categoryName), value: result.data, categoryGroupId });
};
