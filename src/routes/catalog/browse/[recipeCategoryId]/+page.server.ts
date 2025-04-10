import { getBasicRecipes, getSpirit } from '$lib/server/core';
import type { View } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
  const spirit = await getSpirit(params.recipeCategoryId);
  
  let images: any = [];
  images = images.map(({ url }) => ({ src: url, alt: 'test' }));
  
  let queryResult = await getBasicRecipes(params.recipeCategoryId);
  let recipes: View.BasicRecipe[] = [] as View.BasicRecipe[];
  if('data' in queryResult) {
    recipes = queryResult.data as View.BasicRecipe[];
  }
  return { spirit, recipes, images };
}) satisfies PageServerLoad;