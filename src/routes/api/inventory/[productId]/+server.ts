import { fail, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteInventoryItem } from '$lib/server/core';
import { StatusCodes } from 'http-status-codes';

export const DELETE: RequestHandler = async ({ params }) => {
  if(!params?.productId) {
    return json({
      error: { message: 'Inventory item not found.'}
    })
  }

  let { productId } = params as any;
  productId = Number(productId);


  if(isNaN(productId)) {
    return json({
      error: { message: 'Invalid or malformed inventory ID.' }
    });
  }

  const result = await deleteInventoryItem(productId);
  return json(result);

};