import { error } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { catalogRepo } from '$lib/server/core';
import { userRepo } from '$lib/server/auth';
import type { View } from '$lib/types';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url, parent, locals }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const { recipeCategoryId } = params;
	const userId = locals.user?.userId;

	if (!recipeCategoryId || isNaN(Number(recipeCategoryId))) {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'Invalid category ID.',
		});
	}

	// Parse query params
	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = parseInt(url.searchParams.get('perPage') || '24');
	const search = url.searchParams.get('search') || '';
	const sort = url.searchParams.get('sort') || 'name-asc';

	// Build filter - always include the spirit category
	const filter: Record<string, any> = {
		recipeCategoryId: parseInt(recipeCategoryId),
	};
	if (search) {
		filter.recipeName = search;
	}

	// Get spirits, recipes, favorites, and featured in parallel
	const [spirits, catalogResult, userFavorites, featuredRecipes] = await Promise.all([
		catalogRepo.getSpirits(),
		catalogRepo.findAll(workspaceId, page, perPage, filter),
		userId ? userRepo.getFavorites(userId, workspaceId) : Promise.resolve([]),
		catalogRepo.getFeatured(workspaceId),
	]);

	const spirit = spirits.find((s) => s.recipeCategoryId === Number(recipeCategoryId));

	if (!spirit) {
		error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'Category not found.',
		});
	}

	let { data, pagination } = catalogResult;

	// Build sets for quick lookup
	const favoriteRecipeIds = new Set(userFavorites.map((f) => f.recipeId));
	const featuredRecipeIds = new Set(featuredRecipes.map((f) => f.recipeId));

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

	// Cast to View.BasicRecipe since the basicrecipe view returns all fields
	const recipes = data as View.BasicRecipe[];

	return {
		spirit,
		spirits,
		recipes,
		pagination,
		favoriteRecipeIds: [...favoriteRecipeIds],
		featuredRecipeIds: [...featuredRecipeIds],
		filters: {
			search,
			sort,
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
