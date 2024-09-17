import { getSpirits } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async ({ request }) => {
  // await info('test')
  const spirits = await getSpirits();
  console.log(spirits)
  return { args: { spirits } };
}) satisfies PageServerLoad;