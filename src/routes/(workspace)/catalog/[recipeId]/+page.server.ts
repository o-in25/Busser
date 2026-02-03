import { error } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { catalogRepo } from '$lib/server/core';
import { userRepo } from '$lib/server/auth';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, locals }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const { recipeId } = params;
	const userId = locals.user?.userId;

	if (!recipeId || isNaN(Number(recipeId))) {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'Invalid recipe ID.',
		});
	}

	const result = await catalogRepo.findById(workspaceId, recipeId);

	if (result.status === 'error' || !result.data) {
		error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'Recipe not found.',
		});
	}

	// Check if this recipe is favorited by the user
	const isFavorite = userId
		? await userRepo.isFavorite(userId, Number(recipeId))
		: false;

	// Check if this recipe is featured in the workspace
	const isFeatured = await catalogRepo.isFeatured(workspaceId, Number(recipeId));

	return {
		recipe: result.data.recipe,
		recipeSteps: result.data.recipeSteps,
		isFavorite,
		isFeatured,
	};
};

export const actions: Actions = {
	toggleFavorite: async ({ request, locals }) => {
		const userId = locals.user?.userId;
		if (!userId) {
			return { success: false, error: 'Not authenticated' };
		}

		const formData = await request.formData();
		const recipeId = Number(formData.get('recipeId'));
		const workspaceId = formData.get('workspaceId') as string;

		if (!recipeId || !workspaceId) {
			return { success: false, error: 'Missing required fields' };
		}

		const result = await userRepo.toggleFavorite(userId, recipeId, workspaceId);

		if (result.status === 'error') {
			return { success: false, error: result.error };
		}

		return { success: true, isFavorite: result.data?.isFavorite };
	},

	toggleFeatured: async ({ request, locals }) => {
		const userId = locals.user?.userId;
		if (!userId) {
			return { success: false, error: 'Not authenticated' };
		}

		const formData = await request.formData();
		const recipeId = Number(formData.get('recipeId'));
		const workspaceId = formData.get('workspaceId') as string;

		if (!recipeId || !workspaceId) {
			return { success: false, error: 'Missing required fields' };
		}

		const result = await catalogRepo.toggleFeatured(workspaceId, recipeId);

		if (result.status === 'error') {
			return { success: false, error: result.error };
		}

		return { success: true, isFeatured: result.data?.isFeatured };
	},
};
