import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { CatalogGenerator } from '$lib/server/generators/catalog-generator';

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
	const generator = new CatalogGenerator();
	const result = await generator.generateContent(body.recipeName);
	return json(result);
};
