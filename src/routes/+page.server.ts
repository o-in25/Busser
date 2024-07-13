import { getBaseSpirits, seedGallery } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async () => {
  const gallery = await seedGallery();
  const spirits = await getBaseSpirits();
  return { args: { gallery, spirits } };
}) satisfies PageServerLoad;