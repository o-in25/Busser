import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import type { RequestHandler } from './$types';
import { getSignedUrl } from '$lib/server/storage';

export const config = {
	body: { maxSize: '1mb' },
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.activeWorkspaceId) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: 'Unauthorized',
			code: StatusCodes.UNAUTHORIZED,
			message: 'Workspace context required',
		});
	}

	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file || file.size === 0) {
			error(StatusCodes.BAD_REQUEST, {
				reason: 'Bad Request',
				code: StatusCodes.BAD_REQUEST,
				message: 'No file provided',
			});
		}

		const publicUrl = await getSignedUrl(file);

		if (!publicUrl) {
			throw new Error('Failed to upload image');
		}

		return json({ url: publicUrl });
	} catch (err: unknown) {
		console.error('Image upload error:', err);
		const message = err instanceof Error ? err.message : 'Failed to upload image';
		error(StatusCodes.INTERNAL_SERVER_ERROR, {
			reason: 'Internal Server Error',
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			message,
		});
	}
};
