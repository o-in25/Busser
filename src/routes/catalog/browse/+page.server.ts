import { getRecipeCategories, getCatalog } from '$lib/server/core';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export const load = (async ({ url }) => {

  const query: any = {};

  if(url.searchParams.get('searchTerm')) {
    query.recipeName = url.searchParams.get('searchTerm');
  }

  if(url.searchParams.get('productInStockQuantity')) {
    query.productInStockQuantity = url.searchParams.get('productInStockQuantity');
  }

  const { data, pagination } = await getCatalog(1, 90, query);

  // TODO: get this onmount in component
  const queryResult = await getRecipeCategories();

  if(!('data' in queryResult)) {
    return error(StatusCodes.INTERNAL_SERVER_ERROR, {
      reason: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      code: StatusCodes.NOT_FOUND,
      message: 'Could not load Catalog. Please try again later.'
    });
  }

  return {
    searchResult: data,
    categories: queryResult.data || [],
    pagination

  };

}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    console.log(formData);
    return {
      success: { message: 'User has been created.' }
    };
  }
};