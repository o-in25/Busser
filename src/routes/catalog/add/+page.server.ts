import { getPreparationMethods, getSpirits, productSelect, updateCatalog } from '$lib/server/core';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export const load = (async ({ locals }) => {
  if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('add_catalog')) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to access this resource.'
    });
  }

  // await info('test')
  const spirits = await getSpirits();
  const preparationMethods = await getPreparationMethods();
  const products = await productSelect();
  const pageData: any = { args: { spirits, preparationMethods } };
  if('data' in preparationMethods) {
    pageData.args = { ...pageData.args, preparationMethods: preparationMethods.data };
  }

  if('data' in products) {
    pageData.args = { ...pageData.args, products: products.data };
  }

  return pageData;
}) satisfies PageServerLoad;


export const actions = {
  default: async ({ request, locals }) => {
    if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('add_catalog')) {
      fail(StatusCodes.UNAUTHORIZED, {
        status: StatusCodes.UNAUTHORIZED,
        error: 'You do not have permission to perform this action.'
      });
    }

    let formData: any = Object.fromEntries(await request.formData());
    let { recipeImageUrl, recipeSteps, ...payload } = formData;
    const { recipeImageUrl: file } = formData as { recipeImageUrl: File; };

    const recipe = {
      ...payload,
      recipeCategoryId: Number(payload.recipeCategoryId) || -1,
      recipeTechniqueDescriptionId: Number(payload.recipeTechniqueDescriptionId) || -1,
    };

    recipeSteps = JSON.parse(recipeSteps as string);
    recipeSteps = recipeSteps.map(({
      recipeStepId,
      categoryDescription,
      categoryName,
      supplierName,
      supplierDetails,
      productName,
      productInStockQuantity,
      productPricePerUnit,
      productUnitSizeInMilliliters,
      productProof,
      ...rest
    }) => rest);

    const newData = await updateCatalog(recipe, recipeSteps, file);

    if(newData.status === 'error') {
      return fail(500, newData);
    }

    return newData;
  }
};