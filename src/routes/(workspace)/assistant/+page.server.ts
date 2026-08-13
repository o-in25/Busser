import { catalogRepo, inventoryRepo } from '$lib/server/core';
import { getUserWorkspaces } from '$lib/server/workspace';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) {
		return { authenticated: false as const, canModify: false, editableWorkspaces: [] };
	}

	const { workspace } = await parent();

	const canModify = workspace.workspaceRole === 'owner' || workspace.workspaceRole === 'editor';

	// hero stats — same counts the catalog/inventory pages surface
	const [recipeCount, inventoryStats] = await Promise.all([
		catalogRepo.getRecipeCount(workspace.workspaceId),
		inventoryRepo.getStats(workspace.workspaceId),
	]);

	let editableWorkspaces: Array<{ workspaceId: string; workspaceName: string }> = [];

	if (!canModify && locals.user) {
		const result = await getUserWorkspaces(locals.user.userId);
		if (result.status === 'success' && result.data) {
			editableWorkspaces = result.data
				.filter((w) => w.workspaceRole === 'owner' || w.workspaceRole === 'editor')
				.map((w) => ({ workspaceId: w.workspaceId, workspaceName: w.workspaceName }));
		}
	}

	return {
		authenticated: true as const,
		canModify,
		editableWorkspaces,
		workspaceName: workspace.workspaceName,
		recipeCount,
		productCount: inventoryStats.total,
	};
};
