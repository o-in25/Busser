import { isInviteOnly } from '$lib/server/auth';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { inviteOnly: await isInviteOnly() };
};
