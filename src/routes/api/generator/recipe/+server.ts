import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { generate } from '$lib/server/generators/generator-factory';
import { generateCached } from '$lib/server/generators/cache';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.activeWorkspaceId) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: 'Unauthorized',
			code: StatusCodes.UNAUTHORIZED,
			message: 'Workspace context required',
		});
	}

	const body = await request.json();
	const { trigger, recipeId, regenerate } = body;

	if (!trigger) {
		error(StatusCodes.BAD_REQUEST, {
			reason: 'Bad Request',
			code: StatusCodes.BAD_REQUEST,
			message: 'Recipe name is required for description generation',
		});
	}

	// no recipeId = prompt generation during recipe creation (no caching)
	if (!recipeId) {
		const result = await generate('recipe-insights', { cocktailName: trigger });
		return json({ ...result, description: result.history });
	}

	// with recipeId = recipe detail page (cached)
	const result = await generateCached(
		'recipe-insights',
		{ cocktailName: trigger },
		Number(recipeId),
		{ regenerate: !!regenerate }
	);
	return json({ ...result, description: result.history });
};
