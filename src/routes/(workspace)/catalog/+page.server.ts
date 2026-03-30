import { catalogRepo } from '$lib/server/core';
import { userRepo } from '$lib/server/auth';
import { getFavoriteRecipes } from '$lib/server/user-settings';
import { indexFromSeed } from '$lib/math';
import type { View } from '$lib/types';

import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ parent, locals }) => {
	// get workspace from parent layout
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const userId = locals.user?.userId;

	// Get all spirits (global reference data)
	const spirits = await catalogRepo.getSpirits();

	// Get recent cocktails (first page, limit 6)
	const recentCatalog = await catalogRepo.findAll(workspaceId, 1, 6);
	const recentCocktails = recentCatalog.data;

	// Get total recipe count
	const totalCatalog = await catalogRepo.findAll(workspaceId, 1, 1);
	const totalRecipes = totalCatalog.pagination.total;

	// Get recipe counts per spirit category
	const spiritCounts: Record<number, number> = {};
	for (const spirit of spirits) {
		const result = await catalogRepo.getRecipesByCategory(workspaceId, spirit.recipeCategoryId);
		if (result.status === 'success' && result.data) {
			spiritCounts[spirit.recipeCategoryId] = result.data.length;
		} else {
			spiritCounts[spirit.recipeCategoryId] = 0;
		}
	}

	// ready to make and almost-there counts
	const availableResult = await catalogRepo.getAvailableRecipes(workspaceId);
	const availableCount =
		availableResult.status === 'success' ? (availableResult.data?.length ?? 0) : 0;
	const almostThereRecipes = await catalogRepo.getAlmostThereRecipes(workspaceId);
	const almostThereCount = almostThereRecipes.length;

	// highest impact ingredient to buy
	const impactIngredients = await catalogRepo.getHighestImpactIngredients(workspaceId);
	const topIngredient = impactIngredients.length > 0 ? impactIngredients[0] : null;

	// Get workspace featured cocktails (curated by workspace admins)
	const featuredCocktails = await catalogRepo.getFeatured(workspaceId);

	// cocktail of the day: deterministic daily pick from all recipes
	const allRecipes = (await catalogRepo.findAll(workspaceId, 1, 9999)).data;
	const today = new Date();
	const cocktailOfTheDay = indexFromSeed(allRecipes, `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`);

	// Get user's favorites for this workspace
	const userFavorites = userId ? await userRepo.getFavorites(userId, workspaceId) : [];
	const favoriteRecipeIds = new Set(userFavorites.map((f) => f.recipeId));
	const favoriteRecipes = userId ? await getFavoriteRecipes(userId, workspaceId) : [];

	// Get featured recipe IDs for this workspace
	const featuredRecipeIds = new Set(featuredCocktails.map((f) => f.recipeId));

	// Find most popular spirit (one with most recipes)
	let popularSpirit: (typeof spirits)[0] | null = null;
	let maxCount = 0;
	for (const spirit of spirits) {
		const count = spiritCounts[spirit.recipeCategoryId] || 0;
		if (count > maxCount) {
			maxCount = count;
			popularSpirit = spirit;
		}
	}

	return {
		args: {
			spirits,
			spiritCounts,
			recentCocktails,
			featuredCocktails,
			cocktailOfTheDay,
			favoriteRecipes,
			totalRecipes,
			popularSpirit,
			availableCount,
			almostThereCount,
			topIngredient,
			favoriteRecipeIds: [...favoriteRecipeIds],
			featuredRecipeIds: [...featuredRecipeIds],
		},
	};
}) satisfies PageServerLoad;

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
