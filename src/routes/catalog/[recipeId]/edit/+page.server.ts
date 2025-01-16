// import { generateImage } from '$lib/server/ai';
import { getPreparationMethods, getBasicRecipe, getSpirits, editRecipe } from '$lib/server/core';
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

    recipeSteps = JSON.parse(recipeSteps as string);
    recipeSteps = recipeSteps.map(({ recipeStepId, ...rest }) => rest);


    const newData = await editRecipe(recipe, recipeSteps, file);

    if(newData.status === 'error') {
      return fail(500, newData);

    }

    return newData;
    
    console.log(newData)
    // await addRecipe(recipe, recipeSteps, file);


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

    return fail(500, { message: 'Stuff happened'})
    
    const submitResult: FormSubmitResult = {
      success: {
        message: 'Product created!'
      }
    }
    return submitResult;
  }
};