import { getWorkspace, userRepo } from '$lib/server/auth';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	let { user } = locals;
	user = JSON.parse(JSON.stringify(user));

	let workspaceName: string | null = null;

	// fetch fresh avatar url from db since jwt token may be stale
	if (user?.userId) {
		const result = await userRepo.findById(user.userId);
		if (result.status === 'success' && result.data) {
			user.avatarImageUrl = result.data.avatarImageUrl;

			// generate avatar on first login if user doesn't have one
			if (!user.avatarImageUrl) {
				const avatarResult = await userRepo.generateAndUploadAvatar(user.userId);
				if (avatarResult.status === 'success' && avatarResult.data) {
					user.avatarImageUrl = avatarResult.data;
				}
			}
		}

		// fetch active workspace name for nav display
		if (locals.activeWorkspaceId) {
			const wsResult = await getWorkspace(user.userId, locals.activeWorkspaceId);
			if (wsResult.status === 'success' && wsResult.data) {
				workspaceName = wsResult.data.workspaceName;
			}
		}
	}

	return { user, workspaceName };
};
