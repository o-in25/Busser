import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { inventoryRepo } from '$lib/server/core';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, params }) => {
	const workspaceId = locals.activeWorkspaceId;
	if (!workspaceId || !locals.user) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: 'Unauthorized',
			code: StatusCodes.UNAUTHORIZED,
			message: 'Workspace context required',
		});
	}

	const categoryId = Number(params.categoryId);
	if (isNaN(categoryId)) {
		error(StatusCodes.BAD_REQUEST, {
			reason: 'Bad Request',
			code: StatusCodes.BAD_REQUEST,
			message: 'Invalid category ID.',
		});
	}

	const categoryResult = await inventoryRepo.findCategoryById(workspaceId, categoryId);
	if (categoryResult.status === 'error' || !categoryResult.data) {
		error(StatusCodes.NOT_FOUND, {
			reason: 'Not Found',
			code: StatusCodes.NOT_FOUND,
			message: 'Category not found.',
		});
	}

	const [subcategories, products] = await Promise.all([
		inventoryRepo.findSubcategories(workspaceId, categoryId),
		inventoryRepo.findProductsByCategory(workspaceId, categoryId),
	]);

	// Fetch products for each subcategory
	const subcategoryProducts: Record<number, typeof products> = {};
	await Promise.all(
		subcategories.map(async (sub) => {
			subcategoryProducts[sub.categoryId] = await inventoryRepo.findProductsByCategory(
				workspaceId,
				sub.categoryId
			);
		})
	);

	return json({
		category: categoryResult.data,
		subcategories,
		products,
		subcategoryProducts,
	});
};
