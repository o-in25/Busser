import { getInventory } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  let queryString = url.href.split('?').slice(1).join('?');
  const hrefParams = new URLSearchParams(queryString);
  let hrefValue = hrefParams.get('page');
  let page = Number(hrefValue);
  let { data, pagination } = await getInventory(page, 5);

  // let { total, perPage } = pagination;
  // let pages: any = Math.ceil(total / perPage);
  // if(!Number.isNaN(pages)) {
  //   pages = [...Array(pages)].map((_, index) => ({
  //     name: (index + 1).toString(),
  //     href: `/inventory?page=${index + 1}`,
  //     active: false
  //   }));
  // }


  // pagination = { ...pagination, pages }
  return { args: { data, pagination } };
};
