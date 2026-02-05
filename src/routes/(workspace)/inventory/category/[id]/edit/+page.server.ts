import { error, fail, redirect } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { canModifyWorkspace } from '$lib/server/auth';
import { inventoryRepo } from '$lib/server/core';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, locals }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const { id } = params;

	// viewers cannot access edit page
	if (!locals.user) {
		redirect(StatusCodes.SEE_OTHER, '/login');
	}
	const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
	if (!canModify) {
		redirect(StatusCodes.SEE_OTHER, '/inventory/category');
	}

	if (!id || isNaN(Number(id))) {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'Invalid category ID.',
		});
	}

	const result = await inventoryRepo.findCategoryById(workspaceId, Number(id));

	if (result.status === 'error' || !result.data) {
		error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'Category not found.',
		});
	}

	// Get all categories for parent selection (excluding current category)
	const [{ data: categories }, { pagination }] = await Promise.all([
		inventoryRepo.findAllCategories(workspaceId, 1, 1000, null),
		inventoryRepo.findAll(workspaceId, 1, 1, { categoryId: Number(id) }),
	]);
	const parentCategories = (categories || []).filter((c) => c.categoryId !== Number(id));

	return {
		category: result.data,
		parentCategories,
		productCount: pagination.total || 0,
	};
};

export const actions: Actions = {
	default: async ({ request, params, locals }) => {
		const workspaceId = locals.activeWorkspaceId;
		if (!workspaceId || !locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Workspace context required.' });
		}

		const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
		if (!canModify) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'You need editor or owner access to edit categories.',
			});
		}
		const { id } = params;

		const formData = await request.formData();

		const categoryName = formData.get('categoryName') as string;
		const categoryDescription = (formData.get('categoryDescription') as string) || '';
		const parentCategoryIdRaw = formData.get('parentCategoryId') as string;
		const parentCategoryId = parentCategoryIdRaw ? Number(parentCategoryIdRaw) : null;

		if (!categoryName) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Category name is required.' });
		}

		const category = {
			categoryId: Number(id),
			categoryName,
			categoryDescription,
			parentCategoryId,
			baseSpiritId: null, // Will be derived from parent in repository
		};

		const result = await inventoryRepo.updateCategory(workspaceId, category);

		if (result.status === 'error') {
			return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: result.error });
		}

		redirect(StatusCodes.SEE_OTHER, '/inventory/category');
	},
};
