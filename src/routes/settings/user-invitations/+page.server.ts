import { fail } from '@sveltejs/kit';

import {
	createInvitation,
	deleteInvitation,
	fulfillInvitationRequest,
	getInvitationRequests,
	getInvitations,
	rejectInvitationRequest,
} from '$lib/server/auth';
import type { Invitation, InvitationRequest } from '$lib/types/auth';

import type { Actions, PageServerLoad } from './$types';

export const load = (async () => {
	// Get existing invitations
	let queryResult = await getInvitations();
	let invitations: Invitation[] = [];
	if ('data' in queryResult) {
		invitations = queryResult.data || [];
	}

	// Get pending invitation requests
	let requestsResult = await getInvitationRequests('pending');
	let pendingRequests: InvitationRequest[] = [];
	if ('data' in requestsResult) {
		pendingRequests = requestsResult.data || [];
	}

	return {
		invitations,
		pendingRequests,
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const formData = await request.formData();
		const code = formData.get('code') as string | null;
		const email = formData.get('email') as string | null;
		const expiration = formData.get('expiration') as string | null;
		const requestId = formData.get('requestId') as string | null;

		if (!email || !email.trim()) {
			return fail(400, { error: 'Email is required.' });
		}

		const result = await createInvitation(email, expiration, code);

		if (result.status === 'error') {
			return fail(400, { error: result.error });
		}

		// If this was created from a request, mark it as fulfilled
		if (requestId && locals.user?.userId) {
			await fulfillInvitationRequest(Number(requestId), locals.user.userId);
		}

		return { success: true };
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const invitationId = formData.get('invitationId');

		if (!invitationId) {
			return fail(400, { error: 'Invitation ID is required.' });
		}

		const result = await deleteInvitation(Number(invitationId));

		if (result.status === 'error') {
			return fail(400, { error: result.error });
		}

		return { success: true };
	},

	rejectRequest: async ({ request, locals }) => {
		const formData = await request.formData();
		const requestId = formData.get('requestId');

		if (!requestId) {
			return fail(400, { error: 'Request ID is required.' });
		}

		if (!locals.user?.userId) {
			return fail(401, { error: 'Unauthorized.' });
		}

		const result = await rejectInvitationRequest(Number(requestId), locals.user.userId);

		if (result.status === 'error') {
			return fail(400, { error: result.error });
		}

		return { success: true, rejected: true };
	},

};
