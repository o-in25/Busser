import { error } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { catalogRepo } from '$lib/server/core';
import type { View } from '$lib/types';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const { recipeCategoryId } = params;

	if (!recipeCategoryId || isNaN(Number(recipeCategoryId))) {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'Invalid category ID.',
		});
	}

	// Get spirits to find the category info and recipes in parallel
	const [spirits, recipesResult] = await Promise.all([
		catalogRepo.getSpirits(),
		catalogRepo.getRecipesByCategory(workspaceId, Number(recipeCategoryId)),
	]);

	const spirit = spirits.find((s) => s.recipeCategoryId === Number(recipeCategoryId));

	if (!spirit) {
		error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'Category not found.',
		});
	}

	// Cast to View.BasicRecipe since the basicrecipe view returns all fields
	const recipes = (
		recipesResult.status === 'success' ? recipesResult.data || [] : []
	) as View.BasicRecipe[];

	return {
		spirit,
		spirits,
		recipes,
	};
};
