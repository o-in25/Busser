import { addProductImage, addToInventory, categorySelect } from '$lib/server/core';
import { getSignedUrl } from '$lib/server/storage';
import type { FormSubmitResult, Product } from '$lib/types';
import type { PageServerLoad } from './$types';
import multer from 'multer';

import { tmpdir } from 'os';

const upload = multer({ dest: tmpdir() });

export const load = (async () => {
  // await categorySelect();
    return {};
}) satisfies PageServerLoad;


export const actions = {
  add: async({ request }) => {
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

    const { productId } = await addToInventory({
      productName,
      categoryId: Number(categoryId),
      productInStockQuantity: Number(productInStockQuantity),
      productPricePerUnit: Number(productPricePerUnit),
      productUnitSizeInMilliliters: Number(productUnitSizeInMilliliters),
      productProof: Number(productProof),
    } as Product);

    if(productId === -1) {
      // ERROR
      return {
        error: { message: 'Failed to create new inventory item.' }
      } as FormSubmitResult;
    }

    if(productImageUrl) {
      const { productImageUrl: file } = formData as { productImageUrl: File; };
      const { productDetailId } = await addProductImage(productId, file);
      if(productDetailId === -1) {
        // ERROR
        return {
          error: { message: 'Failed add image to inventory item.' }
        } as FormSubmitResult;
      }
    }

    // OK
    return {
      success: { message: 'Inventory has been updated.' }
    } as FormSubmitResult;
  }
}

