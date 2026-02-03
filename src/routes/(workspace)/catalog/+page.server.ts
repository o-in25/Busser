import { catalogRepo } from '$lib/server/core';
import { userRepo } from '$lib/server/auth';
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

	// Get workspace featured cocktails (curated by workspace admins)
	const featuredCocktails = await catalogRepo.getFeatured(workspaceId);

	// Fallback: if no featured cocktails, pick a random one from recent
	let featuredCocktail: View.BasicRecipe | null = featuredCocktails[0] || null;
	if (!featuredCocktail && recentCocktails.length > 0) {
		const randomIndex = Math.floor(Math.random() * recentCocktails.length);
		featuredCocktail = recentCocktails[randomIndex];
	}

	// Get user's favorites for this workspace
	const userFavorites = userId
		? await userRepo.getFavorites(userId, workspaceId)
		: [];
	const favoriteRecipeIds = new Set(userFavorites.map((f) => f.recipeId));

	// Get featured recipe IDs for this workspace
	const featuredRecipeIds = new Set(featuredCocktails.map((f) => f.recipeId));

	// Find most popular spirit (one with most recipes)
	let popularSpirit = spirits[0] || null;
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
			featuredCocktail,
			featuredCocktails,
			totalRecipes,
			popularSpirit,
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
