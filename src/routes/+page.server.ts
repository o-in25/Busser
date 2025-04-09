import { getBaseSpirits, seedGallery } from '$lib/server/core';
import { error } from '@sveltejs/kit';
// import { createOcrWorker } from '$lib/server/ocr';
import type { PageServerLoad } from './$types';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
export const load = (async ({ request }) => {
  const baseSpiritsQuery = await getBaseSpirits();
  const gallerySeedQuery = await seedGallery();


  if(!('data' in baseSpiritsQuery) || !('data' in gallerySeedQuery)) {
    return error(StatusCodes.INTERNAL_SERVER_ERROR, {
      reason: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
      code: StatusCodes.NOT_FOUND,
      message: 'Could not load Gallery. Please try again later.'
    }); 
  }


  return {
    spirits: baseSpiritsQuery.data || [],
    recipes: gallerySeedQuery.data || []
  }

}) satisfies PageServerLoad;