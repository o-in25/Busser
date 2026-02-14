import { error } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { hasGlobalPermission, getUserWorkspaces } from '$lib/server/auth';
import { catalogRepo, inventoryRepo } from '$lib/server/core';
import { getUser } from '$lib/server/user';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
			code: StatusCodes.UNAUTHORIZED,
			message: 'Authentication required.',
		});
	}

	if (!hasGlobalPermission(locals.user, 'view_admin')) {
		error(StatusCodes.FORBIDDEN, {
			reason: getReasonPhrase(StatusCodes.FORBIDDEN),
			code: StatusCodes.FORBIDDEN,
			message: 'You do not have permission to access this resource.',
		});
	}

	const { userId } = params;
	if (!userId) {
		error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'User not found.',
		});
	}

	const queryResult = await getUser(userId);
	if (queryResult.status !== 'success' || !queryResult.data) {
		error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'User not found.',
		});
	}

	const user = queryResult.data;

	const workspacesResult = await getUserWorkspaces(userId);
	const workspaces = workspacesResult.status === 'success' ? (workspacesResult.data || []) : [];

	// fetch resource counts per workspace
	const workspaceCounts = await Promise.all(
		workspaces.map(async (ws) => {
			const [recipeCount, inventoryStats] = await Promise.all([
				catalogRepo.getRecipeCount(ws.workspaceId),
				inventoryRepo.getStats(ws.workspaceId),
			]);

			return {
				...ws,
				recipeCount,
				productCount: inventoryStats.total,
			};
		})
	);

	return { viewUser: user, workspaces: workspaceCounts };
};
