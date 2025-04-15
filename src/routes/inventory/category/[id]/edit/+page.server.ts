import { getCategory, updateCategory } from '$lib/server/core';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export const load = (async ({ locals, params }) => {
  if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_category')) {
    return error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to access this resource.'
    });
  }

  // return {};
  const queryResult = await getCategory(Number(params.id));
  if(queryResult.status === 'error') {
    return error(StatusCodes.NOT_FOUND, {
      reason: getReasonPhrase(StatusCodes.NOT_FOUND),
      code: StatusCodes.NOT_FOUND,
      message: queryResult.error
    });
  }

  return {
    category: queryResult.data
  };


}) satisfies PageServerLoad;

export const actions = {
  default: async ({ locals, request, params }) => {

    if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_category')) {
      return fail(StatusCodes.UNAUTHORIZED, {
        status: getReasonPhrase(StatusCodes.UNAUTHORIZED),
        error: 'You do not have permission to access this resource.'
      });
    }
    

    const formData = await request.formData();

    const newData = await updateCategory({
      categoryId: Number(params.id),
      categoryDescription: formData.get('categoryDescription')?.toString() || '',
      categoryName: formData.get('categoryName')?.toString() || ''
    })

    if(newData.status === 'error') {
      return fail(StatusCodes.INTERNAL_SERVER_ERROR, {
        status: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        error: newData.error
      })
    }

    return newData;

  }
}