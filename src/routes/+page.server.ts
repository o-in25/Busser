import { scanImage } from '$lib/server/ai';
import { getBaseSpirits, seedGallery } from '$lib/server/core';
// import { createOcrWorker } from '$lib/server/ocr';
import type { PageServerLoad } from './$types';
export const load = (async ({ request }) => {
  // await info('test')
  const gallery = await seedGallery();
  const spirits = await getBaseSpirits();
  // await scanImage();
  return { args: { gallery, spirits } };
}) satisfies PageServerLoad;