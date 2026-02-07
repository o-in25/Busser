import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { generate } from '$lib/server/generators/generator-factory';

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
	const { trigger } = body;

	if (!trigger) {
		error(StatusCodes.BAD_REQUEST, {
			reason: 'Bad Request',
			code: StatusCodes.BAD_REQUEST,
			message: 'Recipe name is required for description generation',
		});
	}

	const result = await generate('recipe-insights', { cocktailName: trigger });
	return json(result);
};
