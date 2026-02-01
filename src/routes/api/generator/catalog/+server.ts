import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import type { RequestHandler } from './$types';
import { RecipeGenerator } from '$lib/server/generators/recipe-generator';

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
	const result = await generator.generateContent(body.trigger);
	return json(result);
};
