import { getInventory, getSpirits } from '$lib/server/core';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes } from 'http-status-codes';

export const load: PageServerLoad = async ({ url }) => {
  // redirect to page 1
  if(!url.searchParams.size) {
    throw redirect(StatusCodes.TEMPORARY_REDIRECT, url.pathname.concat('?', 'page=1'));
  }

  let page: string | number = url.searchParams.get('page') || '1';
  page = Number(page);

  const productInStockQuantity = url.searchParams.get('productInStockQuantity');
  const productName = url.searchParams.get('productName');

  let filter = {};
  if(productName) {
    filter = { productName };
  }

  if(productInStockQuantity) {
    filter = { ...filter, productInStockQuantity };
  }

  let { data, pagination } = await getInventory(page, 20, filter);
  const tableData = await getSpirits();
  return { args: { data, pagination, tableData } };
};
