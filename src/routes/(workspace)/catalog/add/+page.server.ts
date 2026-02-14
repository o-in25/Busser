import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { canModifyWorkspace } from '$lib/server/auth';
import { catalogRepo, inventoryRepo } from '$lib/server/core';

import type { Actions, PageServerLoad } from './$types';

export const config = {
	body: { maxSize: '1mb' },
};

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;

	// viewers cannot access add page
	if (!locals.user) {
		redirect(StatusCodes.SEE_OTHER, '/login');
	}
	const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
	if (!canModify) {
		redirect(StatusCodes.SEE_OTHER, '/catalog');
	}

	const [spirits, preparationMethodsResult, productOptions] = await Promise.all([
		catalogRepo.getSpirits(),
		catalogRepo.getPreparationMethods(),
		inventoryRepo.getProductOptions(workspaceId),
	]);

	const preparationMethods =
		preparationMethodsResult.status === 'success' && preparationMethodsResult.data
			? preparationMethodsResult.data
			: [];

	return {
		spirits,
		preparationMethods,
		productOptions,
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const workspaceId = locals.activeWorkspaceId;
		if (!workspaceId || !locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Workspace context required.' });
		}

		const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
		if (!canModify) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'You need editor or owner access to add recipes.',
			});
		}

		const formData = await request.formData();

		const recipeName = formData.get('recipeName') as string;
		const recipeCategoryId = Number(formData.get('recipeCategoryId'));
		const recipeDescription = (formData.get('recipeDescription') as string) || '';
		const recipeTechniqueDescriptionId = Number(formData.get('recipeTechniqueDescriptionId') || 1);
		const recipeSweetnessRating = Number(formData.get('recipeSweetnessRating') || 5);
		const recipeDrynessRating = Number(formData.get('recipeDrynessRating') || 5);
		const recipeStrengthRating = Number(formData.get('recipeStrengthRating') || 5);
		const recipeVersatilityRating = Number(formData.get('recipeVersatilityRating') || 5);
		const recipeStepsJson = formData.get('recipeSteps') as string;
		const recipeImageUrl = (formData.get('recipeImageUrl') as string) || '';
		const recipeImageCleared = formData.get('recipeImageCleared') === 'true';

		if (!recipeName) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Recipe name is required.' });
		}

		let recipeSteps = [];
		try {
			recipeSteps = JSON.parse(recipeStepsJson || '[]');
		} catch {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Invalid recipe steps format.' });
		}

		const recipe = {
			recipeName,
			recipeCategoryId,
			recipeDescription,
			recipeTechniqueDescriptionId,
			recipeSweetnessRating,
			recipeDrynessRating,
			recipeStrengthRating,
			recipeVersatilityRating,
		};

		const result = await catalogRepo.save(
			workspaceId,
			recipe,
			recipeSteps,
			recipeImageUrl,
			recipeImageCleared
		);

		if (result.status === 'error') {
			return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: result.error });
		}

		redirect(StatusCodes.SEE_OTHER, `/catalog/${result.data?.recipe.recipeId}`);
	},
};
