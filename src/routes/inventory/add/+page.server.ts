// import { addProductImage, addToInventory, categorySelect, updateInventory } from '$lib/server/core';
import { addToInventory } from '$lib/server/core';
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
    const { productImageUrl: file } = formData as { productImageUrl: File; };
    const productData = {
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
    // productId, supplierId, productImageUrl, categoryName, categoryDescription
    // const { productImageUrl: file } = formData as { productImageUrl: File; };
    const newItem = {} //await addToInventory();

    if(!newItem) {
      // ERROR
      return {
        error: { message: 'Inventory item not be updated.' }
      } as FormSubmitResult;
    }

    // if(productId =\) {
    //   // ERROR
    //   return {
    //     error: { message: 'Failed to create new inventory item.' }
    //   } as FormSubmitResult;
    // }

    // if(productImageUrl) {
    //   const { productImageUrl: file } = formData as { productImageUrl: File; };
    //   const { productDetailId } = await addProductImage(productId, file);
    //   if(productDetailId === -1) {
    //     // ERROR
    //     return {
    //       error: { message: 'Failed add image to inventory item.' }
    //     } as FormSubmitResult;
    //   }
    // }

    // OK
    return {
      success: { message: 'Inventory has been updated.' }
    } as FormSubmitResult;
  }
}

