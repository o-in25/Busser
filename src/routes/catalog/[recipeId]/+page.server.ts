// import { generateImage } from '$lib/server/ai';
import { getBasicRecipe } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async ({ request, params }) => {
    // const gen = new RecipeGenerator();
    // // const content = await gen.generateContent('Old Fashioned');
    // console.log(content)
    const { recipeId } = params;
    // await generateImage();
    const recipe = await getBasicRecipe(recipeId)
    return {
      result: recipe
    };
}) satisfies PageServerLoad;