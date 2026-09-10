import { error, json } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { catalogRepo } from '$lib/server/core';
import type { AdvancedFilter } from '$lib/types';

import type { RequestHandler } from './$types';

// recipes that use this product, capped — the sheet shows the first page and links to the
// full filtered list at /catalog?ingredientInclude=<id> for the rest.
const RECIPE_CAP = 12;

export const GET: RequestHandler = async ({ locals, params }) => {
	const workspaceId = locals.activeWorkspaceId;
	if (!workspaceId || !locals.user) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
			code: StatusCodes.UNAUTHORIZED,
			message: 'Workspace context required',
		});
	}

	const productId = Number(params.productId);
	if (isNaN(productId)) {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'Invalid or malformed inventory ID.',
		});
	}

	const advancedFilter: AdvancedFilter = { ingredientInclude: [productId] };
	const { data, pagination } = await catalogRepo.findAll(
		workspaceId,
		1,
		RECIPE_CAP,
		null,
		advancedFilter
	);

	return json({ recipes: data, total: pagination.total });
};
