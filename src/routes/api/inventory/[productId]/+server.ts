import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { inventoryRepo } from '$lib/server/core';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export const DELETE: RequestHandler = async ({ locals, params }) => {
  const workspaceId = locals.activeWorkspaceId;
  if (!workspaceId) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: 'Unauthorized',
      code: StatusCodes.UNAUTHORIZED,
      message: 'Workspace context required'
    });
  }

  if (!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('delete_inventory')) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to perform this action.'
    });
  }

  if (!params?.productId) {
    error(StatusCodes.NOT_FOUND, {
      reason: getReasonPhrase(StatusCodes.NOT_FOUND),
      code: StatusCodes.NOT_FOUND,
      message: 'Inventory item not found.'
    });
  }

  const productId = Number(params.productId);

  if (isNaN(productId)) {
    return json({
      error: { message: 'Invalid or malformed inventory ID.' }
    });
  }

  const result = await inventoryRepo.delete(workspaceId, productId);
  return json(result);
};