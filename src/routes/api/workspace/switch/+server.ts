import { error, json } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { hasWorkspaceAccess } from '$lib/server/auth';

import type { RequestHandler } from './$types';

// session-only workspace switch (sets cookie, does not update DB preference)
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	const userId = locals.user?.userId;
	if (!userId) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: 'Unauthorized',
			code: StatusCodes.UNAUTHORIZED,
			message: 'Authentication required',
		});
	}

	const { workspaceId } = await request.json();
	if (!workspaceId || typeof workspaceId !== 'string') {
		error(StatusCodes.BAD_REQUEST, {
			reason: 'Bad Request',
			code: StatusCodes.BAD_REQUEST,
			message: 'workspaceId is required',
		});
	}

	const role = await hasWorkspaceAccess(userId, workspaceId);
	if (!role) {
		error(StatusCodes.FORBIDDEN, {
			reason: 'Forbidden',
			code: StatusCodes.FORBIDDEN,
			message: 'You do not have access to this workspace',
		});
	}

	cookies.set('activeWorkspaceId', workspaceId, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 60 * 60 * 24, // 24 hours (session-like, not persistent)
	});

	return json({ status: 'success', workspaceRole: role });
};
