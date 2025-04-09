import { categorySelect, getBaseSpirits, getBasicRecipes, getSpirits } from '$lib/server/core';
import type { BasicRecipe, QueryResult, SelectOption } from '$lib/types';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export const load = (async () => {
  // const queryResult = await getBasicRecipes();
  // const baseSpirits = await getBaseSpirits();
  
  // let recipes: BasicRecipe[] | undefined = [];

  // if(queryResult.status === 'error') {
  //   return error(500, { message: queryResult.error } as App.Error);
  // }

  // if(queryResult.status === 'success') {
  //   recipes = queryResult.data;
  // }

  // return { recipes, baseSpirits }
  const basicRecipesQuery = await getBasicRecipes();
  const baseSpiritsQuery = await getBaseSpirits();

  if(!('data' in basicRecipesQuery) || !('data' in baseSpiritsQuery)) {
    return error(StatusCodes.INTERNAL_SERVER_ERROR, {
      reason: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      code: StatusCodes.NOT_FOUND,
      message: 'Could not load Catalog. Please try again later.'
    }); 
  }

  let recipes = [...(basicRecipesQuery.data || []), ...(basicRecipesQuery.data || [])]
  recipes = [...recipes, ...recipes];
  recipes = [...recipes, ...recipes];
  recipes = [...recipes, ...recipes];

  return {
    recipes,
    baseSpirits: baseSpiritsQuery.data || []
  }

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