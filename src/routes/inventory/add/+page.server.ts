import { categorySelect } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async () => {
  // await categorySelect();
    return {};
}) satisfies PageServerLoad;