import { inventoryRepo } from '$lib/server/core';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Product } from '$lib/types';
import { StatusCodes } from 'http-status-codes';

export const load: PageServerLoad = async ({ parent }) => {
  const { workspace } = await parent();
  const workspaceId = workspace.workspaceId;

  const categories = await inventoryRepo.getCategoryOptions(workspaceId);

  return {
    categories
  };
};

export const actions: Actions = {
  add: async ({ request, locals }) => {
    const workspaceId = locals.activeWorkspaceId;
    if (!workspaceId) {
      return fail(StatusCodes.UNAUTHORIZED, { error: 'Workspace context required.' });
    }

    const formData = await request.formData();

    const productName = formData.get('productName') as string;
    const categoryId = formData.get('categoryId') as string;
    const productPricePerUnit = parseFloat(formData.get('productPricePerUnit') as string) || 0;
    const productUnitSizeInMilliliters = parseInt(formData.get('productUnitSizeInMilliliters') as string) || 0;
    const productProof = parseFloat(formData.get('productProof') as string) || 0;
    const productInStockQuantity = parseInt(formData.get('productInStockQuantity') as string) || 0;
    const productSweetnessRating = parseFloat(formData.get('productSweetnessRating') as string) || 0;
    const productDrynessRating = parseFloat(formData.get('productDrynessRating') as string) || 0;
    const productStrengthRating = parseFloat(formData.get('productStrengthRating') as string) || 0;
    const productVersatilityRating = parseFloat(formData.get('productVersatilityRating') as string) || 0;
    const productDescription = formData.get('productDescription') as string || '';
    const productImageFile = formData.get('productImageUrl') as File;

    if (!productName) {
      return fail(StatusCodes.BAD_REQUEST, { error: 'Product name is required.' });
    }

    if (!categoryId) {
      return fail(StatusCodes.BAD_REQUEST, { error: 'Category is required.' });
    }

    const product = {
      productName,
      categoryId: parseInt(categoryId),
      productPricePerUnit,
      productUnitSizeInMilliliters,
      productProof,
      productInStockQuantity,
      productSweetnessRating,
      productDrynessRating,
      productStrengthRating,
      productVersatilityRating,
      productDescription,
    } as Product;

    const result = await inventoryRepo.create(workspaceId, product, productImageFile);

    if (result.status === 'error') {
      return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: result.error });
    }

    redirect(StatusCodes.SEE_OTHER, '/inventory');
  }
};
