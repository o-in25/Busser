import { getBasicRecipes, getSpirit } from '$lib/server/core';
import type { BasicRecipe } from '$lib/types';
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { CatalogGenerator } from '$lib/server/generators/catalog-generator';

export const load = (async ({ params }) => {
  const spirit = await getSpirit(params.recipeCategoryId);
  const generator = new CatalogGenerator();
  
  let content = await generator.generateContent(spirit?.recipeCategoryDescription || '')
  let images: any = [];
  images = images.map(({ url }) => ({ src: url, alt: 'test' }));
  
  let queryResult = await getBasicRecipes(params.recipeCategoryId);
  let recipes: BasicRecipe[] | undefined = [];
  if('data' in queryResult) {
    recipes = queryResult.data;
  }
  return { spirit, recipes: recipes, images, content };
}) satisfies PageServerLoad;