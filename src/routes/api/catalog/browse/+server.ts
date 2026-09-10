import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { catalogRepo } from '$lib/server/core';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const workspaceId = locals.activeWorkspaceId;
	if (!workspaceId) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: 'Unauthorized',
			code: StatusCodes.UNAUTHORIZED,
			message: 'Workspace context required',
		});
	}

	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = parseInt(url.searchParams.get('perPage') || '24');
	const searchTerm = url.searchParams.get('search') || '';
	const spiritId = url.searchParams.get('spirit') || '';
	const availableOnly = url.searchParams.get('available') === 'true';
	const sort = url.searchParams.get('sort') || 'name-asc';

	const filter: Record<string, any> = {};

	if (searchTerm) {
		filter.recipeName = searchTerm;
	}

	if (availableOnly) {
		filter.productInStockQuantity = 1;
	}

	let { data, pagination } = await catalogRepo.findAll(workspaceId, page, perPage, filter);

	if (spiritId) {
		const spiritIdNum = parseInt(spiritId);
		data = data.filter((recipe) => recipe.recipeCategoryId === spiritIdNum);
		pagination = {
			...pagination,
			total: data.length,
			lastPage: 1,
		};
	}

	switch (sort) {
		case 'name-asc':
			data.sort((a, b) => a.recipeName.localeCompare(b.recipeName));
			break;
		case 'name-desc':
			data.sort((a, b) => b.recipeName.localeCompare(a.recipeName));
			break;
		case 'newest':
			data.sort((a, b) => b.recipeId - a.recipeId);
			break;
		case 'oldest':
			data.sort((a, b) => a.recipeId - b.recipeId);
			break;
	}

	return json({
		recipes: data,
		pagination,
		filters: {
			search: searchTerm,
			spirit: spiritId,
			available: availableOnly,
			sort,
		},
	});
};
