import { findInventoryItem, updateInventory } from '$lib/server/core';
import type { FormSubmitResult } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load = (async ({ request, params }) => {
  const { id } = params;
  const product = await findInventoryItem(Number(id));
  return { args: { product } };
}) satisfies PageServerLoad;

export const actions = {
  edit: async ({ request, params }) => {
    let { id } = params;
    if(!id) {
      // ERROR
      return {
        error: { message: 'Inventory item not found.' }
      } as FormSubmitResult;
    }

    let existing = await findInventoryItem(Number(id));
    let formData = Object.fromEntries(await request.formData());
    let {
      productName,
      categoryId,
      productInStockQuantity,
      productPricePerUnit,
      productUnitSizeInMilliliters,
      productProof,
      productImageUrl
    } = formData;

    const product = await updateInventory({
      productId: Number(id),
      productName: productName.toString(),
      categoryId: Number(categoryId),
      productInStockQuantity: Number(productInStockQuantity),
      productPricePerUnit: Number(productPricePerUnit),
      productUnitSizeInMilliliters: Number(productUnitSizeInMilliliters),
      productProof: Number(productProof),
    });


    if(!product) {
      // ERROR
      return {
        error: { message: 'Inventory item not be updated.' }
      } as FormSubmitResult;
    }

    // product.productName = 'The guy from bane capital'

    // OK
    return {
      args: { product },
      success: { message: 'Inventory has been updated.' }
    } as FormSubmitResult;
  }
}
