import { categorySelect } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async () => {
  // await categorySelect();
    return {};
}) satisfies PageServerLoad;


export const actions = {
  add: async({ request }) => {
    const formData = await request.formData();
    Object.keys()
  }
}