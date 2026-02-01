import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import type { RequestHandler } from './$types';
import { ImageGenerator } from '$lib/server/generators/image-generator';

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
		const { subject } = body;

		if (!subject) {
			error(StatusCodes.BAD_REQUEST, {
				reason: 'Bad Request',
				code: StatusCodes.BAD_REQUEST,
				message: 'Subject is required for image generation',
			});
		}

		const generator = new ImageGenerator();
		const result = await generator.generateContent(subject);
		return json(result);
	} catch (err: unknown) {
		console.error('Image generation error:', err);
		const message = err instanceof Error ? err.message : 'Failed to generate image';
		error(StatusCodes.INTERNAL_SERVER_ERROR, {
			reason: 'Internal Server Error',
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			message,
		});
	}
};
