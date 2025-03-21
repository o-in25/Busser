import { getPreparationMethods, getSpirits, productSelect, updateCatalog } from '$lib/server/core';
import type { Table } from '$lib/types';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ request }) => {
  // await info('test')
  const spirits = await getSpirits();
  const preparationMethods = await getPreparationMethods();
  const products = await productSelect();
  const pageData: any = { args: { spirits, preparationMethods } };
  if('data' in preparationMethods) {
    pageData.args = { ...pageData.args, preparationMethods: preparationMethods.data }
  }

  if('data' in products) {
    pageData.args = { ...pageData.args, products: products.data };
  }

  return pageData;
}) satisfies PageServerLoad;


export const actions = {
  default: async ({ request }) => {
    let formData: any = Object.fromEntries(await request.formData());
    let { recipeImageUrl, recipeSteps, ...payload } = formData;
    const { recipeImageUrl: file } = formData as { recipeImageUrl: File; };

    const recipe = {
      ...payload,
      recipeCategoryId: Number(payload.recipeCategoryId) || -1,
      recipeTechniqueDescriptionId: Number(payload.recipeTechniqueDescriptionId) || -1,
    }

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

    // addRecipe
    // {
    //   recipe: {
    //     recipeName: 'Fuck Marry Kill',
    //       recipeCategoryId: 5,
    //         recipeCategoryDescriptionText: 'Do it....DO IT',
    //           recipeTechniqueDescriptionId: 2;
    //   },
    //   recipeSteps: [
    //     {
    //       recipeStepId: 'd17c202c-293f-4eb7-87da-76139836d6cb',
    //       productId: 3,
    //       productIdQuantityInMilliliters: 6,
    //       recipeStepDescription: 'Add da bitterz'
    //     },
    //     {
    //       recipeStepId: '7748f0a1-423b-4588-819c-68b69ef604a6',
    //       productId: 4,
    //       productIdQuantityInMilliliters: 23,
    //       recipeStepDescription: 'Wine me up'
    //     }
    //   ],
    //     file: File {
    //     size: 23438,
    //       type: 'image/jpeg',
    //         name: 'Sidecar-cocktail.jpg',
    //           lastModified: 1728058996729;
    //   }
    // }
    // let recipeSteps = formData.get('recipeSteps');
    // recipeSteps = JSON.parse(recipeSteps as string);
    // const recipeName = formData.get('recipeSteps') as string;
    // let recipeCategoryId: string | number = formData.get('recipeCategoryId') as string;
    // recipeCategoryId = Number(recipeCategoryId);
    // const recipeCategoryDescriptionText = formData.get('recipeCategoryDescriptionText') as string;
    // let recipeTechniqueDescriptionId: string | number = formData.get('recipeCategoryId') as string;
    // recipeTechniqueDescriptionId = Number(recipeTechniqueDescriptionId);
    // const { productImageUrl: file } = formData as { productImageUrl: File; };

    return {
      success: { message: 'User has been created.' }
    };
  }
};