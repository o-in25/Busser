import { findInventoryItem } from '$lib/server/core';
import type { FormSubmitResult } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load = (async ({ request, params }) => {
  const { id } = params;
  const product = await findInventoryItem(Number(id));
  return { args: { product } };
}) satisfies PageServerLoad;

export const actions = {
  edit: async ({ request, params }) => {
    const { id } = params;
    if(!id) {
      // ERROR
      return {
        error: { message: 'Inventory item not found.' }
      } as FormSubmitResult;
    }
    const product = await findInventoryItem(Number(id));
    if(!product) {
      // ERROR
      return {
        error: { message: 'Inventory item not found.' }
      } as FormSubmitResult;
    }

    product.productName = 'The guy from bane capital'

    // OK
    return {
      args: { product },
      success: { message: 'Inventory has been updated.' }
    } as FormSubmitResult;
  }
}