import { getBasicRecipes, getSpirits } from '$lib/server/core';
import type { BasicRecipe } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load = (async () => {
  const recipes = await getBasicRecipes();
  let data: BasicRecipe[] = [];
  if('data' in recipes) {
    data = recipes.data;
  }
  return { recipes: data }

}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    console.log(formData)
    return {
      success: { message: 'User has been created.' }
    }
  }
}