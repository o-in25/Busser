import { getBaseSpirits, seedGallery } from '$lib/server/core';
import { info } from '$lib/server/logger';
import type { PageServerLoad } from './$types';

export const load = (async ({ request }) => {
  // await info('test')
  const gallery = await seedGallery();
  const spirits = await getBaseSpirits();
  return { args: { gallery, spirits } };
}) satisfies PageServerLoad;