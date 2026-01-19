import { getBasicRecipes, getSpirit, getSpirits } from '$lib/server/core';
import type { View } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
  const spirit = await getSpirit(params.recipeCategoryId);
  const queryResult = await getBasicRecipes(params.recipeCategoryId);

  let recipes: View.BasicRecipe[] = [];
  if (queryResult.status === 'success' && queryResult.data) {
    recipes = queryResult.data as View.BasicRecipe[];
  }

  // Get all spirits for "Related Spirits" section
  const allSpirits = await getSpirits();
  const relatedSpirits = allSpirits.filter(
    s => s.recipeCategoryId !== spirit?.recipeCategoryId
  ).slice(0, 4);

  // Pick signature cocktails (up to 3 with images, or just first 3)
  const cocktailsWithImages = recipes.filter(r => r.recipeImageUrl);
  const signatureCocktails = cocktailsWithImages.length >= 3
    ? cocktailsWithImages.slice(0, 3)
    : recipes.slice(0, 3);

  return {
    spirit,
    recipes,
    relatedSpirits,
    signatureCocktails,
    recipeCount: recipes.length,
  };
}) satisfies PageServerLoad;
