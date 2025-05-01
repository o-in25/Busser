import { createInvite, getInvitations } from '$lib/server/auth';
import type { Invitation } from '$lib/types/auth';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    let queryResult = await getInvitations();
    let invitations: Invitation[] = [];
    if('data' in queryResult) {
      invitations = queryResult.data || [];
    }
    console.log(invitations)
    return {
      invitations
    };
}) satisfies PageServerLoad;