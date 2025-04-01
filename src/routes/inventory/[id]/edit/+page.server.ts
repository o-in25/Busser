import { addProductImage, editProductImage, findInventoryItem, updateInventory } from '$lib/server/core';
import type { FormSubmitResult } from '$lib/types';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
const { NOT_FOUND } = StatusCodes;

export const load = (async ({ locals, request, params }) => {
  console.log(locals)
  const { id } = params;
  const product = await findInventoryItem(Number(id));
  if(!product) {
    error(NOT_FOUND, {
      reason: getReasonPhrase(NOT_FOUND),
      code: NOT_FOUND,
      message: 'Product not found.'
    });
  }
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
      supplierId: 1, // not needed for insert
      categoryName: '', // not needed for insert
      categoryDescription: '', // not needed for insert
      productImageUrl: '', // cast to file type
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
