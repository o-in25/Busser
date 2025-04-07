import { getBaseSpirits, getInventory } from '$lib/server/core';
import type { Product } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  // redirect to page 1
  if(!url.searchParams.size) {
    throw redirect(307, url.pathname.concat('?', 'page=1'))
  }

  let page: string | number = url.searchParams.get('page') || '1'
  page = Number(page);

  const productInStockQuantity = url.searchParams.get('productInStockQuantity');
  // productInStockQuantity = Number(productInStockQuantity);

  const productName = url.searchParams.get('productName')

  let filter = {};
  if(productName) {
    filter = { productName }
  }

  if(productInStockQuantity) {
    filter = { ...filter, productInStockQuantity }
  }

  // if(!isNaN(productInStockQuantity)) {

  //   filter = { ...filter, productInStockQuantity }

  // }



  // console.log(url.searchParams.get('productName'))
  // let queryString = url.href.split('?').slice(1).join('?');
  // const hrefParams = new URLSearchParams(queryString);
  // let hrefValue = hrefParams.get('page');
  // let page = Number(hrefValue);
  // let filter: Partial<Product> = {};
  // hrefValue = hrefParams.get('productName');
  // if(hrefValue) {
  //   filter = {
  //     productName: hrefValue
  //   }
  // }
  // hrefValue = hrefParams.get('productInStockQuantity');
  // filter = { ...filter, productInStockQuantity: 1}
  // console.log(hrefValue)
  // if(hrefValue && !isNaN(Number(hrefValue))) {
  //   filter = { ... filter, productInStockQuantity: Number(hrefValue)}
  // }

  let { data, pagination } = await getInventory(page, 20, filter);

  return { args: { data, pagination } };
};
