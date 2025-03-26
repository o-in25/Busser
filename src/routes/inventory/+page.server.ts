import { getBaseSpirits, getInventory } from '$lib/server/core';
import type { Product } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  // redirect to page 1
  if(!url.searchParams.size) {
    throw redirect(307, url.pathname.concat('?', 'page=1'))
  }
  let queryString = url.href.split('?').slice(1).join('?');
  const hrefParams = new URLSearchParams(queryString);
  let hrefValue = hrefParams.get('page');
  let page = Number(hrefValue);
  let filter: Partial<Product> = {};
  hrefValue = hrefParams.get('productName');
  if(hrefValue) {
    filter = {
      productName: hrefValue
    }
  }
  let { data, pagination } = await getInventory(page, 20, filter);
  // could probably keep these in a store
  // let baseSpirits = await getBaseSpirits();
  // let { total, perPage } = pagination;
  // let pages: any = Math.ceil(total / perPage);
  // if(!Number.isNaN(pages)) {
  //   pages = [...Array(pages)].map((_, index) => ({
  //     name: (index + 1).toString(),
  //     href: `/inventory?page=${index + 1}`,
  //     active: false
  //   }));
  // }


  // console.log(data)
  // pagination = { ...pagination, pages }
  return { args: { data, pagination } };
};
