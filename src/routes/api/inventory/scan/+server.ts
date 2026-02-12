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
	const { image, categories } = body;

	if (!image) {
		error(StatusCodes.BAD_REQUEST, {
			reason: 'Bad Request',
			code: StatusCodes.BAD_REQUEST,
			message: 'Image is required for bottle scanning',
		});
	}

	try {
		const result = await generate('bottle-scan', { image, categories: categories || [] });
		return json(result);
	} catch (err: any) {
		error(StatusCodes.INTERNAL_SERVER_ERROR, {
			reason: 'Internal Server Error',
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			message: err.message || 'Failed to scan bottle',
		});
	}
};
