import { addToInventory, categorySelect } from '$lib/server/core';
import type { Product } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load = (async () => {
  // await categorySelect();
    return {};
}) satisfies PageServerLoad;


export const actions = {
  add: async({ request }) => {
    const formData = await request.formData();
    let product: Product = {
      categoryId: Number(formData.get('categoryId')?.toString()) || 0,
      productName: formData.get('productName')?.toString() || '',
      productInStockQuantity: Number(formData.get('productInStockQuantity')?.toString()) || 0,
      productPricePerUnit: Number(formData.get('productPricePerUnit')?.toString()) || 0,
      productUnitSizeInMilliliters: Number(formData.get('productUnitSizeInMilliliters')?.toString()) || 0,
      productProof: Number(formData.get('productProof')?.toString()) || 0,
    }

    console.log(product)
    // const product: Product = Array.from(formData.entries()).reduce((acc, [key, value]) => {
    //   acc = { ...acc, [key]: value}
    //   return acc;
    // }, {}) as Product;
    // product.supplierId = 1;
    // product.productInStockQuantity = 1;
    const result = await addToInventory(product);

  }
}