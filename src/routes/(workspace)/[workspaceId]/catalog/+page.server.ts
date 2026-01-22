import { catalogRepo } from '$lib/server/core';
import type { PageServerLoad } from './$types';
import type { View } from '$lib/types';

export const load = (async ({ parent }) => {
  // get workspace from parent layout
  const { workspace } = await parent();
  const workspaceId = workspace.workspaceId;

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

  // Pick a random featured cocktail (if we have any)
  let featuredCocktail: View.BasicRecipe | null = null;
  if (recentCocktails.length > 0) {
    const randomIndex = Math.floor(Math.random() * recentCocktails.length);
    featuredCocktail = recentCocktails[randomIndex];
  }

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
      totalRecipes,
      popularSpirit,
    }
  };
}) satisfies PageServerLoad;
