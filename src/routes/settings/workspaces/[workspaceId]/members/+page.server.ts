import {
  getWorkspaceMembers,
  isWorkspaceOwner,
  addWorkspaceMember,
  updateWorkspaceMemberRole,
  removeWorkspaceMember,
  getWorkspace
} from '$lib/server/auth';
import { getInvitableUsers } from '$lib/server/user';
import { hasGlobalPermission } from '$lib/server/auth';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import type { WorkspaceRole } from '$lib/server/repositories/workspace.repository';

export const load: PageServerLoad = async ({ params, locals }) => {
  if (!locals.user) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'Authentication required.'
    });
  }

  const { workspaceId } = params;

  // only owners can manage members
  const isOwner = await isWorkspaceOwner(locals.user.userId, workspaceId);
  if (!isOwner) {
    error(StatusCodes.FORBIDDEN, {
      reason: getReasonPhrase(StatusCodes.FORBIDDEN),
      code: StatusCodes.FORBIDDEN,
      message: 'Only workspace owners can manage members.'
    });
  }

  // get workspace details
  const workspaceResult = await getWorkspace(locals.user.userId, workspaceId);
  if (workspaceResult.status === 'error' || !workspaceResult.data) {
    error(StatusCodes.NOT_FOUND, {
      reason: getReasonPhrase(StatusCodes.NOT_FOUND),
      code: StatusCodes.NOT_FOUND,
      message: 'Workspace not found.'
    });
  }

  // get current members
  const membersResult = await getWorkspaceMembers(workspaceId);
  if (membersResult.status === 'error') {
    error(StatusCodes.INTERNAL_SERVER_ERROR, {
      reason: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      code: StatusCodes.INTERNAL_SERVER_ERROR,
      message: membersResult.error || 'Failed to load members.'
    });
  }

  // get users that can be invited
  const hasEditAdmin = hasGlobalPermission(locals.user, 'edit_admin');
  const invitableUsers = await getInvitableUsers(locals.user.userId, hasEditAdmin);

  // filter out users who are already members
  const memberUserIds = new Set(membersResult.data?.map(m => m.userId) || []);
  const availableUsers = invitableUsers.filter(u => !memberUserIds.has(u.userId));

  return {
    workspace: workspaceResult.data,
    members: membersResult.data || [],
    availableUsers,
    currentUserId: locals.user.userId
  };
};

export const actions: Actions = {
  addMember: async ({ request, params, locals }) => {
    if (!locals.user) {
      return fail(StatusCodes.UNAUTHORIZED, { error: 'Authentication required.' });
    }

    const { workspaceId } = params;

    // verify owner
    const isOwner = await isWorkspaceOwner(locals.user.userId, workspaceId);
    if (!isOwner) {
      return fail(StatusCodes.FORBIDDEN, { error: 'Only workspace owners can add members.' });
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

    const result = await addWorkspaceMember(workspaceId, userId, role);

    if (result.status === 'error') {
      return fail(StatusCodes.BAD_REQUEST, { error: result.error });
    }

    return { success: true, action: 'add' };
  },

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
        error: 'You cannot demote yourself. Transfer ownership first.'
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
        error: 'You cannot remove yourself. Transfer ownership first or delete the workspace.'
      });
    }

    const result = await removeWorkspaceMember(workspaceId, userId);

    if (result.status === 'error') {
      return fail(StatusCodes.BAD_REQUEST, { error: result.error });
    }

    return { success: true, action: 'remove' };
  }
};
