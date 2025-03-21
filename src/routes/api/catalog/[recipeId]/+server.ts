import { fail, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteCatalogItem, deleteInventoryItem } from '$lib/server/core';
import { StatusCodes } from 'http-status-codes';

export const DELETE: RequestHandler = async ({ params }) => {
  console.log('here')
  let { recipeId } = params as any;

  
  if(!recipeId) {
    return json({
      error: { message: 'Catalog item item not found.'}
    })
  }
  recipeId = Number(recipeId);


  if(isNaN(recipeId)) {
    return json({
      error: { message: 'Invalid or malformed catalog ID.' }
    });
  }

  const result = await deleteCatalogItem(recipeId);
  return json(result);

};