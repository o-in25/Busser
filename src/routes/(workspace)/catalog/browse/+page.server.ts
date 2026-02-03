import { catalogRepo } from '$lib/server/core';
import { userRepo } from '$lib/server/auth';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, parent, locals }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const userId = locals.user?.userId;

	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = parseInt(url.searchParams.get('perPage') || '24');
	const search = url.searchParams.get('search') || '';
	const sort = url.searchParams.get('sort') || 'name-asc';
	const spiritId = url.searchParams.get('spirit') || '';
	const showFilter = url.searchParams.get('show') || ''; // 'favorites' | 'featured' | ''

	// Build filter
	const filter: Record<string, any> = {};
	if (search) {
		filter.recipeName = search;
	}
	if (spiritId) {
		filter.recipeCategoryId = parseInt(spiritId);
	}

	// Get recipes, spirits, favorites, and featured in parallel
	const [catalogResult, spirits, userFavorites, favoriteRecipes, featuredRecipes] = await Promise.all([
		catalogRepo.findAll(workspaceId, page, perPage, Object.keys(filter).length > 0 ? filter : null),
		catalogRepo.getSpirits(),
		userId ? userRepo.getFavorites(userId, workspaceId) : Promise.resolve([]),
		userId ? userRepo.getFavoriteRecipes(userId, workspaceId) : Promise.resolve([]),
		catalogRepo.getFeatured(workspaceId),
	]);

	let { data, pagination } = catalogResult;

	// Build sets for quick lookup
	const favoriteRecipeIds = new Set(userFavorites.map((f) => f.recipeId));
	const featuredRecipeIds = new Set(featuredRecipes.map((f) => f.recipeId));

	// Apply show filter (favorites/featured)
	if (showFilter === 'favorites') {
		// Use the actual favorite recipes, not filtered paginated results
		data = favoriteRecipes;
		pagination = {
			...pagination,
			total: favoriteRecipes.length,
			lastPage: 1,
			currentPage: 1,
		};
	} else if (showFilter === 'featured') {
		// Use the actual featured recipes, not filtered paginated results
		data = featuredRecipes;
		pagination = {
			...pagination,
			total: featuredRecipes.length,
			lastPage: 1,
			currentPage: 1,
		};
	}

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
		favoriteRecipeIds: [...favoriteRecipeIds],
		featuredRecipeIds: [...featuredRecipeIds],
		filters: {
			search,
			sort,
			spiritId,
			showFilter,
			page,
		},
	};
};

export const actions: Actions = {
	toggleFavorite: async ({ request, locals }) => {
		const userId = locals.user?.userId;
		if (!userId) {
			return { success: false, error: 'Not authenticated' };
		}

		const formData = await request.formData();
		const recipeId = Number(formData.get('recipeId'));
		const workspaceId = formData.get('workspaceId') as string;

		if (!recipeId || !workspaceId) {
			return { success: false, error: 'Missing required fields' };
		}

		const result = await userRepo.toggleFavorite(userId, recipeId, workspaceId);

		if (result.status === 'error') {
			return { success: false, error: result.error };
		}

		return { success: true, isFavorite: result.data?.isFavorite };
	},

	toggleFeatured: async ({ request, locals }) => {
		const userId = locals.user?.userId;
		if (!userId) {
			return { success: false, error: 'Not authenticated' };
		}

		const formData = await request.formData();
		const recipeId = Number(formData.get('recipeId'));
		const workspaceId = formData.get('workspaceId') as string;

		if (!recipeId || !workspaceId) {
			return { success: false, error: 'Missing required fields' };
		}

		const result = await catalogRepo.toggleFeatured(workspaceId, recipeId);

		if (result.status === 'error') {
			return { success: false, error: result.error };
		}

		return { success: true, isFeatured: result.data?.isFeatured };
	},
};
