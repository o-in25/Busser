import { getBaseSpirits, seedGallery } from '$lib/server/core';
import { error } from '@sveltejs/kit';
// import { createOcrWorker } from '$lib/server/ocr';
import type { PageServerLoad } from './$types';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
export const load = (async ({ request }) => {
  const spirits = await getBaseSpirits();
  const queryResult = await seedGallery();
  if(queryResult.status === 'error') {
    return error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: queryResult.error
    });
  }
  const recipes = queryResult.data;
  return {
    spirits,
    recipes
  }

}) satisfies PageServerLoad;