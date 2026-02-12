// service layer for cross-database user settings queries
import type { View } from '$lib/types';

import { userRepo } from './auth';
import { catalogRepo } from './core';

export async function getFavoriteRecipes(
	userId: string,
	workspaceId: string
): Promise<View.BasicRecipe[]> {
	const favorites = await userRepo.getFavorites(userId, workspaceId);
	if (favorites.length === 0) return [];

	const recipeIds = favorites.map((f) => f.recipeId);
	const recipes = await catalogRepo.getRecipesByIds(workspaceId, recipeIds);

	// preserve favorites ordering (most recent first)
	const recipeMap = new Map(recipes.map((r) => [r.recipeId, r]));
	return recipeIds.map((id) => recipeMap.get(id)).filter((r): r is View.BasicRecipe => !!r);
}
