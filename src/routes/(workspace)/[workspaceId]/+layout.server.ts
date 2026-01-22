import { error } from '@sveltejs/kit';
import { getWorkspace } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export const load: LayoutServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to access this resource.'
    });
  }

  const { workspaceId } = params;

  const result = await getWorkspace(locals.user.userId, workspaceId);

  if (result.status === 'error' || !result.data) {
    error(StatusCodes.FORBIDDEN, {
      reason: getReasonPhrase(StatusCodes.FORBIDDEN),
      code: StatusCodes.FORBIDDEN,
      message: 'You do not have permission to access this workspace.'
    });
  }

  return {
    workspace: {
      workspaceId: result.data.workspaceId,
      workspaceName: result.data.workspaceName,
      workspaceType: result.data.workspaceType,
      workspaceRole: result.data.workspaceRole,
    }
  };
};
