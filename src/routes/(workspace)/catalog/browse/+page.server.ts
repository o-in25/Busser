import { catalogRepo } from '$lib/server/core';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, parent }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;

	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = parseInt(url.searchParams.get('perPage') || '24');
	const search = url.searchParams.get('search') || '';
	const sort = url.searchParams.get('sort') || 'name-asc';
	const spiritId = url.searchParams.get('spirit') || '';

	// Build filter
	const filter: Record<string, any> = {};
	if (search) {
		filter.recipeName = search;
	}
	if (spiritId) {
		filter.recipeCategoryId = parseInt(spiritId);
	}

	// Get recipes and spirits in parallel
	const [catalogResult, spirits] = await Promise.all([
		catalogRepo.findAll(workspaceId, page, perPage, Object.keys(filter).length > 0 ? filter : null),
		catalogRepo.getSpirits(),
	]);

	let { data, pagination } = catalogResult;

	// Apply client-side sorting
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

	return {
		recipes: data,
		pagination,
		spirits,
		filters: {
			search,
			sort,
			spiritId,
			page,
		},
	};
};
