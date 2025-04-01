import { error, fail, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteInventoryItem } from '$lib/server/core';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export const DELETE: RequestHandler = async ({ locals, params }) => {

  const err: App.Error = {
    reason: getReasonPhrase(400),
    code: 400,
    message: 'Niw allowed'
  }

  if(!locals.user?.permissions.includes('delete_inventory')) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to perform this action.'
    });
  }


  if(!params?.productId) {

    error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.NOT_FOUND),
      code: StatusCodes.NOT_FOUND,
      message: 'Inventory item not found.'
    });
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