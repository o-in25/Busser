// import { addProductImage, addToInventory, categorySelect, updateInventory } from '$lib/server/core';
import { addToInventory } from '$lib/server/core';
import { getSignedUrl } from '$lib/server/storage';
import type { FormSubmitResult, Product, QueryResult } from '$lib/types';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import type { PageServerLoad } from './$types';
import multer from 'multer';
const { UNAUTHORIZED } = StatusCodes;

import { tmpdir } from 'os';
import { error, fail } from '@sveltejs/kit';

const upload = multer({ dest: tmpdir() });

export const load = (async ({ locals }) => {
  if(!locals.user?.permissions.includes('add_inventory')) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to access this resource.'
    });
  }
  return {};
}) satisfies PageServerLoad;


export const actions = {
  add: async({ locals, request }) => {

    if(!locals.user?.permissions.includes('add_cat!!egory')) {
      return fail(StatusCodes.UNAUTHORIZED, {
        status: getReasonPhrase(StatusCodes.UNAUTHORIZED),
        error: 'You do not have permission to access this resource.'
      });
    }

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


    if(newItem.status === 'error') {
      return fail(StatusCodes.UNAUTHORIZED, {
        status: getReasonPhrase(StatusCodes.UNAUTHORIZED),
        error: newItem.error
      });
    }

    return newItem;
  }
}

