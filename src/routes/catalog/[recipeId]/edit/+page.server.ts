// import { generateImage } from '$lib/server/ai';
import { getPreparationMethods, getBasicRecipe, getSpirits, updateCatalog } from '$lib/server/core';
import type { FormSubmitResult } from '$lib/types';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
  const { recipeId } = params;
  const spirits = await getSpirits();
  const preparationMethods = await getPreparationMethods();


  const recipe = await getBasicRecipe(recipeId);

  let pageData: any = { args: { spirits } };
  if('data' in preparationMethods) {
    pageData.args = { ...pageData.args, preparationMethods: preparationMethods.data }
  }

  if('data' in recipe) {
    pageData.args = {
       ...pageData.args, 
       recipe: recipe.data?.recipe,
       recipeSteps: recipe.data?.recipeSteps
    };
  }

  return pageData;

}) satisfies PageServerLoad;



export const actions = {
  default: async ({ request, params }) => {
    let formData: any = Object.fromEntries(await request.formData());
    let { recipeImageUrl, recipeSteps, ...payload } = formData;
    const { recipeImageUrl: file } = formData as { recipeImageUrl: File; };

    const recipe = {
      ...payload,
      recipeId: params.recipeId,
      recipeCategoryId: Number(payload.recipeCategoryId) || -1,
      recipeTechniqueDescriptionId: Number(payload.recipeTechniqueDescriptionId) || -1,
    }

    recipeSteps = JSON.parse(recipeSteps as string || '[]');

    const newData = await updateCatalog(recipe, recipeSteps, file);
    if(newData.status === 'error') {
      return fail(500, newData);

    }

    return newData;
  }
};