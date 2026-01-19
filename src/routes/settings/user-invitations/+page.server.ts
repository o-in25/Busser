import { createInvitation, deleteInvitation, getInvitations } from '$lib/server/auth';
import type { Invitation } from '$lib/types/auth';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
    let queryResult = await getInvitations();
    let invitations: Invitation[] = [];
    if('data' in queryResult) {
      invitations = queryResult.data || [];
    }
    return {
      invitations
    };
}) satisfies PageServerLoad;

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    const code = formData.get('code') as string | null;
    const email = formData.get('email') as string | null;
    const expiration = formData.get('expiration') as string | null;

    if(!email || !email.trim()) {
      return fail(400, { error: 'Email is required.' });
    }

    const result = await createInvitation(email, expiration, code);

    if(result.status === 'error') {
      return fail(400, { error: result.error });
    }

    return { success: true };
  },

  delete: async ({ request }) => {
    const formData = await request.formData();
    const invitationId = formData.get('invitationId');

    if(!invitationId) {
      return fail(400, { error: 'Invitation ID is required.' });
    }

    const result = await deleteInvitation(Number(invitationId));

    if(result.status === 'error') {
      return fail(400, { error: result.error });
    }

    return { success: true };
  }
};