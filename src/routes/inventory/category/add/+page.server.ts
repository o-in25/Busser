import { addCategory, updateCategory } from '$lib/server/core';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import type { FormSubmitResult } from '$lib/types';

export const load = (async ({ locals }) => {
  // if(!locals.user?.permissions.includes('add_category')) {
  //   error(StatusCodes.UNAUTHORIZED, {
  //     reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
  //     code: StatusCodes.UNAUTHORIZED,
  //     message: 'You do not have permission to access this resource.'
  //   });
  // }
  return {};
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ locals, request }) => {
    // if(!locals.user?.permissions.includes('add_category')) {
    //   return fail(StatusCodes.UNAUTHORIZED, {
    //     status: getReasonPhrase(StatusCodes.UNAUTHORIZED),
    //     error: 'You do not have permission to access this resource.'
    //   });
    // }
    

    const formData = await request.formData();

    const newData = await updateCategory({
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