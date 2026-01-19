import { getCatalog, getRecipeCategories, seedGallery, getInventory, getSpirits, getAlmostThereRecipes } from '$lib/server/core';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import type { View } from '$lib/types';

export const load = (async ({ locals }) => {
  const user = locals.user;

  // Get spirits for filter chips
  const baseSpiritsQuery = await getRecipeCategories();

  // Get available recipes (ready to make)
  const gallerySeedQuery = await seedGallery();

  if (!('data' in baseSpiritsQuery) || !('data' in gallerySeedQuery)) {
    return error(StatusCodes.INTERNAL_SERVER_ERROR, {
      reason: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Could not load Gallery. Please try again later.'
    });
  }

  const spirits = baseSpiritsQuery.data || [];
  const recipes = gallerySeedQuery.data || [];

  // Data for authenticated users only
  let dashboardData: {
    inventoryCount: number;
    totalRecipes: number;
    availableCount: number;
    almostThereRecipes: Array<View.BasicRecipe & { missingIngredient: string | null }>;
    allSpirits: Awaited<ReturnType<typeof getSpirits>>;
    spiritCounts: Record<number, number>;
    topSpirit: Awaited<ReturnType<typeof getSpirits>>[0] | null;
    userName: string;
  } | null = null;

  if (user) {
    // Get inventory count
    const inventoryResult = await getInventory(1, 1);
    const inventoryCount = inventoryResult.pagination.total;

    // Get total catalog count
    const catalogResult = await getCatalog(1, 1);
    const totalRecipes = catalogResult.pagination.total;

    // Get "almost there" recipes
    const almostThereRecipes = await getAlmostThereRecipes();

    // Get all spirits with images for the dashboard
    const allSpirits = await getSpirits();

    // Calculate recipes per spirit for the available recipes
    const spiritCounts: Record<number, number> = {};
    for (const recipe of recipes) {
      if (recipe.recipeCategoryId !== undefined) {
        spiritCounts[recipe.recipeCategoryId] = (spiritCounts[recipe.recipeCategoryId] || 0) + 1;
      }
    }

    // Find most productive spirit (one with most available recipes)
    let topSpirit = allSpirits[0] || null;
    let maxCount = 0;
    for (const spirit of allSpirits) {
      const count = spiritCounts[spirit.recipeCategoryId] || 0;
      if (count > maxCount) {
        maxCount = count;
        topSpirit = spirit;
      }
    }

    // Get user display name
    const userName = user.username || user.email?.split('@')[0] || 'there';

    dashboardData = {
      inventoryCount,
      totalRecipes,
      availableCount: recipes.length,
      almostThereRecipes,
      allSpirits,
      spiritCounts,
      topSpirit,
      userName,
    };
  }

  // Data for unauthenticated landing page
  let landingData: {
    totalRecipes: number;
    spiritCount: number;
    featuredRecipes: View.BasicRecipe[];
  } | null = null;

  if (!user) {
    // Get total catalog count for stats
    const catalogResult = await getCatalog(1, 1);
    const totalRecipes = catalogResult.pagination.total;

    // Get spirits for stats
    const allSpirits = await getSpirits();

    // Get featured recipes (ones with images)
    const featuredResult = await getCatalog(1, 6);
    const featuredRecipes = featuredResult.data.filter(r => r.recipeImageUrl).slice(0, 4);

    landingData = {
      totalRecipes,
      spiritCount: allSpirits.length,
      featuredRecipes,
    };
  }

  return {
    spirits,
    recipes,
    dashboardData,
    landingData,
  };
}) satisfies PageServerLoad;
