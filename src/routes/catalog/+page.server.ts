import { getSpirits } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async ({ }) => {
  // await info('test')
  const spirits = await getSpirits();

  return { args: { spirits } };
}) satisfies PageServerLoad;