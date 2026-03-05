import { getUserWorkspaces } from '$lib/server/auth';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { workspace } = await parent();

	const canModify = workspace.workspaceRole === 'owner' || workspace.workspaceRole === 'editor';

	let editableWorkspaces: Array<{ workspaceId: string; workspaceName: string }> = [];

	if (!canModify && locals.user) {
		const result = await getUserWorkspaces(locals.user.userId);
		if (result.status === 'success' && result.data) {
			editableWorkspaces = result.data
				.filter((w) => w.workspaceRole === 'owner' || w.workspaceRole === 'editor')
				.map((w) => ({ workspaceId: w.workspaceId, workspaceName: w.workspaceName }));
		}
	}

	return { canModify, editableWorkspaces };
};
