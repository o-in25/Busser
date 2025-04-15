import { findInventoryItem, updateInventory } from '$lib/server/core';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export const load = (async ({ locals, params }) => {
  if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_inventory')) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to access this resource.'
    });
  }

  const { id } = params;
  const product = await findInventoryItem(Number(id));
  if(!product) {
    error(StatusCodes.NOT_FOUND, {
      reason: getReasonPhrase(StatusCodes.NOT_FOUND),
      code: StatusCodes.NOT_FOUND,
      message: 'Product not found.'
    });
  }
  return { product };
}) satisfies PageServerLoad;

export const actions = {
  edit: async ({ locals, request, params }) => {

    if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_inventory')) {
      return fail(StatusCodes.UNAUTHORIZED, {
        status: getReasonPhrase(StatusCodes.UNAUTHORIZED),
        error: 'You do not have permission to access this resource.'
      });
    }

    const productId = Number(params?.id || '');
    if(isNaN(productId)) {
      // ERROR
      return fail(StatusCodes.BAD_REQUEST, {
        status: getReasonPhrase(StatusCodes.BAD_REQUEST),
        error: 'Invalid inventory ID.'
      });
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
    const queryResult = await updateInventory(productData, file);
    if(queryResult.status === 'error') {
      return fail(StatusCodes.INTERNAL_SERVER_ERROR, {
        status: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        error: queryResult.error
      });
    }

    return queryResult;
  }
};
