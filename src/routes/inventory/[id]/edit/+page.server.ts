import { addProductImage, editProductImage, findInventoryItem, updateInventory } from '$lib/server/core';
import type { FormSubmitResult } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load = (async ({ request, params }) => {
  const { id } = params;
  const product = await findInventoryItem(Number(id));
  return { args: { product } };
}) satisfies PageServerLoad;

export const actions = {
  edit: async ({ request, params }) => {
    const productId = Number(params?.id || '');
    if(isNaN(productId)) {
      // ERROR
      return {
        error: { message: 'Inventory item not found.' }
      } as FormSubmitResult;
    }

    // let existingItem = await findInventoryItem(Number(id));
    let formData = Object.fromEntries(await request.formData());
    const productData = {
      productId,
      productDetailId: Number(formData.productDetailId || -1),
      productName: formData.productName?.toString(),
      categoryId: Number(formData.categoryId),
      productProof: Number(formData.productProof),
      productInStockQuantity: Number(formData.productInStockQuantity),
      productPricePerUnit: Number(formData.productPricePerUnit),
      productUnitSizeInMilliliters: Number(formData.productUnitSizeInMilliliters),
      productSweetnessRating: Number(formData.productSweetnessRating),
      productDrynessRating: Number(formData.productDrynessRating),
      productVersatilityRating: Number(formData.productVersatilityRating),
      productStrengthRating: Number(formData.productStrengthRating),
      productDescription: formData.productDescription?.toString(),

    };
    const { productImageUrl: file } = formData as { productImageUrl: File; };
    const newItem = await updateInventory(productData, file);
    if(!newItem) {
      // ERROR
      return {
        error: { message: 'Inventory item not be updated.' }
      } as FormSubmitResult;
    }

    // OK
    return {
      args: {  product: newItem },
      success: { message: 'Inventory has been updated.' }
    } as FormSubmitResult;
  }
}
