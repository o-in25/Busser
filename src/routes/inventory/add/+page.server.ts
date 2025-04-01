// import { addProductImage, addToInventory, categorySelect, updateInventory } from '$lib/server/core';
import { addToInventory } from '$lib/server/core';
import { getSignedUrl } from '$lib/server/storage';
import type { FormSubmitResult, Product, QueryResult } from '$lib/types';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import type { PageServerLoad } from './$types';
import multer from 'multer';
const { UNAUTHORIZED } = StatusCodes;

import { tmpdir } from 'os';
import { error } from '@sveltejs/kit';

const upload = multer({ dest: tmpdir() });

export const load = (async ({ locals }) => {
      // error(UNAUTHORIZED, {
      //   reason: getReasonPhrase(UNAUTHORIZED),
      //   code: UNAUTHORIZED,
      //   message: 'You do not have permission to view this page.'
      // });
  // await categorySelect();
    return {};
}) satisfies PageServerLoad;


export const actions = {
  add: async({ request }) => {

    let formData = Object.fromEntries(await request.formData());
    const { productImageUrl: file } = formData as { productImageUrl: File; };
    const newItem: QueryResult<Product> = await addToInventory({
      productId: null, // not needed for insert
      supplierId: 1, // not needed for insert
      categoryName: '', // not needed for insert
      categoryDescription: '', // not needed for insert
      productDetailId: null,  // not needed for insert
      productImageUrl: '', // cast to file type

      categoryId: parseInt(formData.categoryId.toString()),
      productName: formData.productName.toString(),
      productInStockQuantity: parseInt(formData.productInStockQuantity.toString()),
      productPricePerUnit: parseFloat(formData.productPricePerUnit.toString()),
      productUnitSizeInMilliliters: parseInt(formData.productUnitSizeInMilliliters.toString()),
      productProof: parseInt(formData.productProof.toString()),
      productDescription: formData.productDescription.toString(),
      productSweetnessRating: parseFloat(formData.productSweetnessRating.toString()),
      productDrynessRating: parseFloat(formData.productDrynessRating.toString()),
      productVersatilityRating: parseFloat(formData.productVersatilityRating.toString()),
      productStrengthRating: parseFloat(formData.productStrengthRating.toString())
    } satisfies Product, file)    
    // const { productImageUrl, ...rest } = formData;
    // type query = { [key: string]: string | 0 }
    // const q = Object.entries(rest).reduce((acc, [key, value]) => {
    //   acc = { ...acc, [key]: !isNaN(0(value))? 0(value) : value.toString() };
    //   return acc;
    // }, {} as query);


    // const product: Product = {
    //   productId: null,
    //   categoryId: q.categoryId,
    //   supplierId: 0,
    //   productName: '',
    //   productInStockQuantity: 0,
    //   productPricePerUnit: 0,
    //   productUnitSizeInMilliliters: 0,
    //   productProof: 0,
    //   productDetailId: 0,
    //   productImageUrl: '',
    //   categoryName: '',
    //   categoryDescription: '',
    //   productDescription: '',
    //   productSweetnessRating: 0,
    //   productDrynessRating: 0,
    //   productVersatilityRating: 0,
    //   productStrengthRating: 0
    // };




    // await addToInventory(query);
    // const productData = {
    //   productDetailId: 0(formData.productDetailId || -1),
    //   productName: formData.productName?.toString(),
    //   categoryId: 0(formData.categoryId),
    //   productProof: 0(formData.productProof),
    //   productInStockQuantity: 0(formData.productInStockQuantity),
    //   productPricePerUnit: 0(formData.productPricePerUnit),
    //   productUnitSizeInMilliliters: 0(formData.productUnitSizeInMilliliters),
    //   productSweetnessRating: 0(formData.productSweetnessRating),
    //   productDrynessRating: 0(formData.productDrynessRating),
    //   productVersatilityRating: 0(formData.productVersatilityRating),
    //   productStrengthRating: 0(formData.productStrengthRating),
    //   productDescription: formData.productDescription?.toString(),

    // };
    // productId, supplierId, productImageUrl, categoryName, categoryDescription
    // const { productImageUrl: file } = formData as { productImageUrl: File; };
    // const newItem = {} //await addToInventory();
    let submitResult: FormSubmitResult = {
      [newItem.status]: {
        message: newItem.status === 'error' ? newItem.error : 'Inventory lookin good g!'
      }
    }

    if('data' in newItem) {
      submitResult = { ...submitResult, args: { product: newItem.data }}
    }

    return submitResult;
    // if(!newItem) {
    //   // ERROR
    //   return {
    //     error: { message: 'Inventory item not be updated.' }
    //   } as FormSubmitResult;
    // }

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
    // return {
    //   success: { message: 'Inventory has been updated.' }
    // } as FormSubmitResult;
  }
}

