import { getBaseSpirits, seedGallery } from '$lib/server/core';
import { getBucket } from '$lib/server/storage';
import type { PageServerLoad } from './$types';
export const load = (async ({ request }) => {
  // await info('test')
  const gallery = await seedGallery();
  const spirits = await getBaseSpirits();
  getBucket('')

  return { args: { gallery, spirits } };
}) satisfies PageServerLoad;