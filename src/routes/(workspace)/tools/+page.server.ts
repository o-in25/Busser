import { catalogRepo } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async ({ parent }) => {
	const { workspace } = await parent();
	const recipesResult = await catalogRepo.findAll(workspace.workspaceId, 1, 100);

	// Get steps for each recipe (needed for alcohol content)
	const recipesWithSteps = await Promise.all(
		recipesResult.data.map(async (recipe) => {
			const result = await catalogRepo.findById(workspace.workspaceId, String(recipe.recipeId));
			return result.status === 'success' ? result.data : null;
		})
	);

	// Filter to alcoholic recipes only (those with at least one step with productProof > 0)
	// Use type guard to ensure we have non-null results
	const alcoholicRecipes = recipesWithSteps.filter(
		(r): r is NonNullable<typeof r> => r != null && r.recipeSteps.some((step) => step.productProof > 0)
	);

	return { bacCalculatorRecipes: alcoholicRecipes };
}) satisfies PageServerLoad;
