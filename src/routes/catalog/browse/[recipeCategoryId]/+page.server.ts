import { getBasicRecipes, getSpirit } from '$lib/server/core';
import type { View } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
  const spirit = await getSpirit(params.recipeCategoryId);
  let queryResult = await getBasicRecipes(params.recipeCategoryId);
  let recipes: View.BasicRecipe[] = [] as View.BasicRecipe[];
  if('data' in queryResult) {
    recipes = queryResult.data as View.BasicRecipe[];
  }
  return { spirit, recipes };
}) satisfies PageServerLoad;