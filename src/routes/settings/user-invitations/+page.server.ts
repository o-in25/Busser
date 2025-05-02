import { createInvite, getInvitations } from '$lib/server/auth';
import { sendSimpleMessage } from '$lib/server/mail';
import type { Invitation } from '$lib/types/auth';
import type { PageServerLoad } from './$types';

export const load = (async () => {
    // await sendSimpleMessage();
    let queryResult = await getInvitations();
    let invitations: Invitation[] = [];
    if('data' in queryResult) {
      invitations = queryResult.data || [];
    }
    return {
      invitations
    };
}) satisfies PageServerLoad;