import { addCategory } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async ({ request }) => {
  // let formData = Object.fromEntries(await request.formData());
  // console.log(formData)
    return {};
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request }) => {
    let formData = Object.fromEntries(await request.formData());
    let categoryName = formData.categoryName.toString();
    let categoryDescription = formData.categoryDescription.toString()
    const result = await addCategory(categoryName, categoryDescription);
    if('error' in result) {
      result.error = result.error === 'ER_DUP_ENTRY' ? `There is already a category named ${categoryName}.` : result.error;
    }

    return result;
  }
}