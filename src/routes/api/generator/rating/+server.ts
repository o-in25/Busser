import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { generate } from '$lib/server/generators/generator-factory';
import type { RecipeRatingsInput } from '$lib/types/generators';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.activeWorkspaceId) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: 'Unauthorized',
			code: StatusCodes.UNAUTHORIZED,
			message: 'Workspace context required',
		});
	}

	const body: RecipeRatingsInput = await request.json();

	if (!body.recipeName || !body.ingredients?.length) {
		error(StatusCodes.BAD_REQUEST, {
			reason: 'Bad Request',
			code: StatusCodes.BAD_REQUEST,
			message: 'Recipe name and ingredients are required',
		});
	}

	const result = await generate('recipe-ratings', body);
	return json(result);
};
