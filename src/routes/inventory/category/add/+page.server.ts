import { addCategory } from '$lib/server/core';
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import type { FormSubmitResult } from '$lib/types';

export const load = (async ({ locals }) => {
  if(!locals.user?.permissions.includes('add_category')) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to access this resource.'
    });
  }
  return {};
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ locals, request }) => {
    if(!locals.user?.permissions.includes('add_inventory')) {
      return fail(StatusCodes.UNAUTHORIZED, {
        error: {
          message: "You do not have permission to access this resource",
        },
        args: {
          product: null
        }
      });
    }


    let formData = Object.fromEntries(await request.formData());
    let categoryName = formData.categoryName.toString();
    let categoryDescription = formData.categoryDescription.toString()
    const newItem = await addCategory(categoryName, categoryDescription);


    let submitResult: FormSubmitResult = {
      [newItem.status]: {
        message: newItem.status === 'error' ? newItem.error : 'Inventory has been updated.'
      }
    }

    if('data' in newItem) {
      submitResult = { ...submitResult, args: { product: newItem.data }}
    }
    return submitResult;

  }
}