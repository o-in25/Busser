import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { inventoryRepo, catalogRepo } from '$lib/server/core';
import { StatusCodes } from 'http-status-codes';

export const GET: RequestHandler = async ({ url, locals }) => {
  const workspaceId = locals.activeWorkspaceId;
  if (!workspaceId) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: 'Unauthorized',
      code: StatusCodes.UNAUTHORIZED,
      message: 'Workspace context required'
    });
  }

  switch (url.pathname) {
    case '/api/select/categories': {
      const response = await inventoryRepo.getCategoryOptions(workspaceId);
      return json(response);
    }

    // Spirits are global reference data, not workspace-specific
    case '/api/select/spirits': {
      const response = await catalogRepo.getSpirits();
      return json(response);
    }

    case '/api/select/products': {
      const response = await inventoryRepo.getProductOptions(workspaceId);
      return json(response);
    }

    default:
      return json({ message: 'Route not found!' });
  }
};