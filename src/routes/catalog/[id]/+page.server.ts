import { getSpirit } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async ({ params }) => {
  const spirit = await getSpirit(params.id);
  return { spirit };
}) satisfies PageServerLoad;