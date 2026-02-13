import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { canModifyWorkspace } from '$lib/server/auth';
import { inventoryRepo } from '$lib/server/core';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;

	// viewers cannot access add page
	if (!locals.user) {
		redirect(StatusCodes.SEE_OTHER, '/login');
	}
	const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
	if (!canModify) {
		redirect(StatusCodes.SEE_OTHER, '/inventory/category');
	}

	// Get top-level categories for parent selection (only categories without a parent)
	const [{ data: categories }, categoryGroups] = await Promise.all([
		inventoryRepo.findAllCategories(workspaceId, 1, 1000, null),
		inventoryRepo.getCategoryGroupOptions(),
	]);
	const parentCategories = (categories || []).filter((c) => !c.parentCategoryId);

	return {
		parentCategories,
		categoryGroups,
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const workspaceId = locals.activeWorkspaceId;
		if (!workspaceId || !locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Workspace context required.' });
		}

		const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
		if (!canModify) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'You need editor or owner access to add categories.',
			});
		}

		const formData = await request.formData();

		const categoryName = formData.get('categoryName') as string;
		const categoryDescription = (formData.get('categoryDescription') as string) || '';
		const parentCategoryIdRaw = formData.get('parentCategoryId') as string;
		const parentCategoryId = parentCategoryIdRaw ? Number(parentCategoryIdRaw) : null;
		const categoryGroupIdRaw = formData.get('categoryGroupId') as string;
		const categoryGroupId = categoryGroupIdRaw ? Number(categoryGroupIdRaw) : null;

		if (!categoryName) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Category name is required.' });
		}

		const result = await inventoryRepo.createCategory(
			workspaceId,
			categoryName,
			categoryDescription,
			parentCategoryId,
			categoryGroupId
		);

		if (result.status === 'error') {
			return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: result.error });
		}

		redirect(StatusCodes.SEE_OTHER, '/inventory/category');
	},
};
