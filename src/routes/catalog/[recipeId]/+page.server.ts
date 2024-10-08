import { getRecipe } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async ({ request, params }) => {
    const { recipeId } = params;
    const recipe = await getRecipe(recipeId)
    return {

    };
}) satisfies PageServerLoad;