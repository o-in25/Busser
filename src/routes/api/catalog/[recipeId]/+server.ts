import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { catalogRepo } from '$lib/server/core';
import { StatusCodes } from 'http-status-codes';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const workspaceId = locals.activeWorkspaceId;
  if (!workspaceId) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: 'Unauthorized',
      code: StatusCodes.UNAUTHORIZED,
      message: 'Workspace context required'
    });
  }

  if (!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('delete_catalog')) {
    return json({
      error: 'You do not have permission to perform this action.'
    });
  }

  const { recipeId } = params;
  if (!recipeId || isNaN(Number(recipeId))) {
    return json({
      error: 'No catalog item found for ID.'
    });
  }

  const result = await catalogRepo.delete(workspaceId, Number(recipeId));
  return json(result);
};