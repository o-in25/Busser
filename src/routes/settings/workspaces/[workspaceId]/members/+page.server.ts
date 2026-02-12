import { error, fail } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import moment from 'moment';

import {
	getWorkspace,
	getWorkspaceMembers,
	isWorkspaceOwner,
	removeWorkspaceMember,
	updateWorkspaceMemberRole,
} from '$lib/server/auth';
import { MailClient } from '$lib/server/mail';
import type { WorkspaceRole } from '$lib/server/repositories/workspace.repository';
import { createInvitation, deleteInvitation, getWorkspaceInvitations } from '$lib/server/user';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		error(StatusCodes.UNAUTHORIZED, {
			reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
			code: StatusCodes.UNAUTHORIZED,
			message: 'Authentication required.',
		});
	}

	const { workspaceId } = params;

	// only owners can manage members
	const isOwner = await isWorkspaceOwner(locals.user.userId, workspaceId);
	if (!isOwner) {
		error(StatusCodes.FORBIDDEN, {
			reason: getReasonPhrase(StatusCodes.FORBIDDEN),
			code: StatusCodes.FORBIDDEN,
			message: 'Only workspace owners can manage members.',
		});
	}

	// get workspace details
	const workspaceResult = await getWorkspace(locals.user.userId, workspaceId);
	if (workspaceResult.status === 'error' || !workspaceResult.data) {
		error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'Workspace not found.',
		});
	}

	// get current members
	const membersResult = await getWorkspaceMembers(workspaceId);
	if (membersResult.status === 'error') {
		error(StatusCodes.INTERNAL_SERVER_ERROR, {
			reason: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
			code: StatusCodes.INTERNAL_SERVER_ERROR,
			message: membersResult.error || 'Failed to load members.',
		});
	}

	// get pending workspace invitations
	const invitationsResult = await getWorkspaceInvitations(workspaceId);
	const pendingInvitations =
		invitationsResult.status === 'success' ? invitationsResult.data || [] : [];

	return {
		workspace: workspaceResult.data,
		members: membersResult.data || [],
		pendingInvitations,
		currentUserId: locals.user.userId,
	};
};

export const actions: Actions = {
	updateRole: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Authentication required.' });
		}

		const { workspaceId } = params;

		// verify owner
		const isOwner = await isWorkspaceOwner(locals.user.userId, workspaceId);
		if (!isOwner) {
			return fail(StatusCodes.FORBIDDEN, { error: 'Only workspace owners can update roles.' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();
		const role = formData.get('role')?.toString() as WorkspaceRole;

		if (!userId) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'User is required.' });
		}

		if (!role || !['owner', 'editor', 'viewer'].includes(role)) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Invalid role.' });
		}

		// prevent owner from demoting themselves
		if (userId === locals.user.userId && role !== 'owner') {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'You cannot demote yourself. Transfer ownership first.',
			});
		}

		const result = await updateWorkspaceMemberRole(workspaceId, userId, role);

		if (result.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, { error: result.error });
		}

		return { success: true, action: 'update' };
	},

	removeMember: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Authentication required.' });
		}

		const { workspaceId } = params;

		// verify owner
		const isOwner = await isWorkspaceOwner(locals.user.userId, workspaceId);
		if (!isOwner) {
			return fail(StatusCodes.FORBIDDEN, { error: 'Only workspace owners can remove members.' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId')?.toString();

		if (!userId) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'User is required.' });
		}

		// prevent owner from removing themselves
		if (userId === locals.user.userId) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'You cannot remove yourself. Transfer ownership first or delete the workspace.',
			});
		}

		const result = await removeWorkspaceMember(workspaceId, userId);

		if (result.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, { error: result.error });
		}

		return { success: true, action: 'remove' };
	},

	inviteNewUser: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Authentication required.' });
		}

		const { workspaceId } = params;

		// verify owner
		const isOwner = await isWorkspaceOwner(locals.user.userId, workspaceId);
		if (!isOwner) {
			return fail(StatusCodes.FORBIDDEN, { error: 'Only workspace owners can invite users.' });
		}

		const formData = await request.formData();
		const email = formData.get('email')?.toString()?.trim()?.toLowerCase();
		const role = formData.get('role')?.toString() as WorkspaceRole;

		if (!email) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Email is required.' });
		}

		// basic email validation
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Invalid email address.' });
		}

		if (!role || !['owner', 'editor', 'viewer'].includes(role)) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Invalid role.' });
		}

		// get workspace for email
		const workspaceResult = await getWorkspace(locals.user.userId, workspaceId);
		if (workspaceResult.status === 'error' || !workspaceResult.data) {
			return fail(StatusCodes.NOT_FOUND, { error: 'Workspace not found.' });
		}

		// create invitation with 7 day expiration
		const expiresAt = moment().add(7, 'days').format('YYYY-MM-DD HH:mm:ss');
		const result = await createInvitation(email, expiresAt, null, workspaceId, role);

		if (result.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, { error: result.error });
		}

		if (!result.data) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Failed to create invitation.' });
		}

		// send invitation email
		try {
			const mailClient = new MailClient();
			await mailClient.sendWorkspaceInvitationEmail([email], {
				workspaceName: workspaceResult.data.workspaceName,
				inviterName: locals.user.username,
				invitationCode: result.data.invitationCode,
				role,
			});
		} catch (error: any) {
			console.error('Failed to send invitation email:', error.message);
			// invitation was created, but email failed - don't fail the action
		}

		return { success: true, action: 'invite' };
	},

	cancelInvitation: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(StatusCodes.UNAUTHORIZED, { error: 'Authentication required.' });
		}

		const { workspaceId } = params;

		// verify owner
		const isOwner = await isWorkspaceOwner(locals.user.userId, workspaceId);
		if (!isOwner) {
			return fail(StatusCodes.FORBIDDEN, {
				error: 'Only workspace owners can cancel invitations.',
			});
		}

		const formData = await request.formData();
		const invitationId = formData.get('invitationId')?.toString();

		if (!invitationId) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Invitation ID is required.' });
		}

		const result = await deleteInvitation(parseInt(invitationId, 10));

		if (result.status === 'error') {
			return fail(StatusCodes.BAD_REQUEST, { error: result.error });
		}

		return { success: true, action: 'cancel' };
	},
};
