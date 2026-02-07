import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { RatingGenerator, type RatingGeneratorInput } from '$lib/server/generators/rating-generator';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.activeWorkspaceId) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: 'Unauthorized',
			code: StatusCodes.UNAUTHORIZED,
			message: 'Workspace context required',
		});
	}

	const body: RatingGeneratorInput = await request.json();

	if (!body.recipeName || !body.ingredients?.length) {
		error(StatusCodes.BAD_REQUEST, {
			reason: 'Bad Request',
			code: StatusCodes.BAD_REQUEST,
			message: 'Recipe name and ingredients are required',
		});
	}

	const generator = new RatingGenerator();
	const result = await generator.generateRatings(body);
	return json(result);
};
