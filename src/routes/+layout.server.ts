import { userRepo } from '$lib/server/auth';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	let { user } = locals;
	user = JSON.parse(JSON.stringify(user));

	// fetch fresh avatar url from db since jwt token may be stale
	if (user?.userId) {
		const result = await userRepo.findById(user.userId);
		if (result.status === 'success' && result.data) {
			user.avatarImageUrl = result.data.avatarImageUrl;
		}
	}

	return { user };
};
