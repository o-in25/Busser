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

	try {
		const body = await request.json();
		const { subject, ingredients, technique, type, description, customPrompt } = body;

		if (!subject && !customPrompt) {
			error(StatusCodes.BAD_REQUEST, {
				reason: 'Bad Request',
				code: StatusCodes.BAD_REQUEST,
				message: 'Subject or custom prompt is required for image generation',
			});
		}

		if (type === 'product') {
			const result = await generate('inventory-image', { subject, description, customPrompt });
			return json(result);
		} else {
			const result = await generate('catalog-image', {
				subject,
				ingredients,
				technique,
				customPrompt,
			});
			return json(result);
		}
	} catch (err: unknown) {
		console.error('Image generation error:', err);
		const raw = err instanceof Error ? err.message : '';
		const isQuota = raw.includes('RESOURCE_EXHAUSTED') || raw.includes('quota');
		const message = isQuota
			? 'Image generation is temporarily unavailable due to high demand. Please try again later.'
			: 'Something went wrong while generating the image. Please try again.';
		error(StatusCodes.INTERNAL_SERVER_ERROR, {
			reason: 'Internal Server Error',
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			message,
		});
	}
};
