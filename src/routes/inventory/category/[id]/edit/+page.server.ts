import { getCategory } from '$lib/server/core';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export const load = (async ({ locals, params }) => {
  if(!locals.user?.permissions.includes('edit_category')) {
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
  default: async ({ locals, request }) => {

    const formData = await request.formData();
    
    return fail(500, {
      status: "error",
      error: "Test"
  })
  }
}