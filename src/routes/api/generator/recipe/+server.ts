import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { RecipeGenerator } from '$lib/server/generators/recipe-generator';

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
	const generator = new RecipeGenerator();
	const result = await generator.generateContent(body.recipeName);
	return json(result);
};
