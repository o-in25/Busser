import { categorySelect, getBaseSpirits, getBasicRecipes, getSpirits } from '$lib/server/core';
import type { BasicRecipe, SelectOption } from '$lib/types';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async () => {
  const queryResult = await getBasicRecipes();
  const baseSpirits = await getBaseSpirits();
  let recipes: BasicRecipe[] | undefined = [];

  if(queryResult.status === 'error') {
    return error(500, { message: queryResult.error } as App.Error);
  }

  if(queryResult.status === 'success') {
    recipes = queryResult.data;
  }

  return { recipes, baseSpirits }

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