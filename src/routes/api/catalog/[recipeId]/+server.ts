import { fail, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteCatalogItem, deleteInventoryItem } from '$lib/server/core';
import { StatusCodes } from 'http-status-codes';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  let { recipeId } = params as any;
  if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('delete_catalog')) {
    return json({
      error: 'You do not have permission to perform this action.'
    });
  }


  if(!recipeId || isNaN(Number(recipeId))) {
    return json({
      error: 'No catalog item found for ID.'
    });
  }

  const result = await deleteCatalogItem(recipeId);
  return json(result);

};