import { getBasicRecipes, getSpirit } from '$lib/server/core';
import type { BasicRecipe } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
  const spirit = await getSpirit(params.recipeCategoryId);
  
  let images: any = [];
  images = images.map(({ url }) => ({ src: url, alt: 'test' }));
  
  let queryResult = await getBasicRecipes(params.recipeCategoryId);
  let recipes: BasicRecipe[] | undefined = [];
  if('data' in queryResult) {
    recipes = queryResult.data;
  }
  return { spirit, recipes: recipes, images };
}) satisfies PageServerLoad;