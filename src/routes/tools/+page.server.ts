import { catalogRepo } from '$lib/server/core';
import { getGlobalWorkspace } from '$lib/server/workspace';
import type { PageServerLoad } from './$types';

const GLOBAL_WORKSPACE = getGlobalWorkspace();

export const load = (async () => {
	const recipesResult = await catalogRepo.findAll(GLOBAL_WORKSPACE, 1, 100);

	// Get steps for each recipe (needed for alcohol content)
	const recipesWithSteps = await Promise.all(
		recipesResult.data.map(async (recipe) => {
			const result = await catalogRepo.findById(GLOBAL_WORKSPACE, String(recipe.recipeId));
			return result.status === 'success' ? result.data : null;
		})
	);

	// Filter to alcoholic recipes only (those with at least one step with productProof > 0)
	// Use type guard to ensure we have non-null results
	const alcoholicRecipes = recipesWithSteps.filter(
		(r): r is NonNullable<typeof r> =>
			r != null && r.recipeSteps.some((step) => step.productProof > 0)
	);

	return { bacCalculatorRecipes: alcoholicRecipes };
}) satisfies PageServerLoad;
