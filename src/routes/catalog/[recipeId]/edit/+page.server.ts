// import { generateImage } from '$lib/server/ai';
import { getPreparationMethods, getBasicRecipe, getSpirits, updateCatalog } from '$lib/server/core';
import type { FormSubmitResult } from '$lib/types';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { deleteSignedUrl } from '$lib/server/storage';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export const load = (async ({ params, locals }) => {
  if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_catalog')) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to access this resource.'
    });
  }

  const { recipeId } = params;
  const spirits = await getSpirits();
  const preparationMethods = await getPreparationMethods();

  const recipe = await getBasicRecipe(recipeId);

  let pageData: any = { args: { spirits } };
  if('data' in preparationMethods) {
    pageData.args = { ...pageData.args, preparationMethods: preparationMethods.data };
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



// on submit:
// if ml -> done
// if oz -> convert to ml save oz

// on load
// if ml -> done
// if oz -> convert ml to oz

export const actions = {
  default: async ({ request, params, locals }) => {

    if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_catalog')) {
      return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: 'You do not have permission to perform this action.' });
    }


    let formData: any = Object.fromEntries(await request.formData());
    let { recipeImageUrl, recipeSteps, ...payload } = formData;
    const { recipeImageUrl: file } = formData as { recipeImageUrl: File; };

    const recipe = {
      ...payload,
      recipeId: params.recipeId,
      recipeCategoryId: Number(payload.recipeCategoryId) || -1,
      recipeTechniqueDescriptionId: Number(payload.recipeTechniqueDescriptionId) || -1,
      productSweetnessRating: Number(payload.productSweetnessRating || '0'),
      productDrynessRating: Number(payload.productDrynessRating || '0'),
      productVersatilityRating: Number(payload.productVersatilityRating || '0'),
      productStrengthRating: Number(payload.productStrengthRating || '0')
    };

    recipeSteps = JSON.parse(recipeSteps as string || '[]');

    const newData = await updateCatalog(recipe, recipeSteps, file);
    if(newData.status === 'error') {
      return fail(StatusCodes.INTERNAL_SERVER_ERROR, newData);

    }

    return newData;
  }
};