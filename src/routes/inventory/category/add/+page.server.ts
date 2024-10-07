import type { PageServerLoad } from './$types';

export const load = (async ({ request }) => {
  // let formData = Object.fromEntries(await request.formData());
  // console.log(formData)
    return {};
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request }) => {
    let formData = Object.fromEntries(await request.formData());
    console.log(formData)
  }
}