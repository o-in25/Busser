import { addProductImage, addToInventory, categorySelect } from '$lib/server/core';
import { getSignedUrl } from '$lib/server/storage';
import type { Product } from '$lib/types';
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
    }

    if(productImageUrl) {
      const { productImageUrl: file } = formData as { productImageUrl: File; };
      const { productDetailId } = await addProductImage(productId, file);
      if(productDetailId === -1) {
        // ERROR
      }
    }


    // OK

    
    // const { fileToUpload } = formData as { fileToUpload: File; };
    // console.log(fileToUpload)
    // await uploadFile(fileToUpload, fileToUpload.name)
    // let product: Product = {
    //   categoryId: Number(formData.get('categoryId')?.toString()) || 0,
    //   productName: formData.get('productName')?.toString() || '',
    //   productInStockQuantity: Number(formData.get('productInStockQuantity')?.toString()) || 0,
    //   productPricePerUnit: Number(formData.get('productPricePerUnit')?.toString()) || 0,
    //   productUnitSizeInMilliliters: Number(formData.get('productUnitSizeInMilliliters')?.toString()) || 0,
    //   productProof: Number(formData.get('productProof')?.toString()) || 0,
    // }

    // console.log(product)
    // // const product: Product = Array.from(formData.entries()).reduce((acc, [key, value]) => {
    // //   acc = { ...acc, [key]: value}
    // //   return acc;
    // // }, {}) as Product;
    // // product.supplierId = 1;
    // // product.productInStockQuantity = 1;
    // const result = await addToInventory(product);

  }
}

