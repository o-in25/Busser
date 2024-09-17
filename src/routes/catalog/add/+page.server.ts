import { getPreparationMethods, getSpirits } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async ({ request }) => {
  // await info('test')
  const spirits = await getSpirits();
  let preparationMethods = await getPreparationMethods();
  let pageData: any = { args: { spirits, preparationMethods } };
  if('data' in preparationMethods) {
    pageData.args = { ...pageData.args, preparationMethods: preparationMethods.data }
  }

  return pageData;
}) satisfies PageServerLoad;