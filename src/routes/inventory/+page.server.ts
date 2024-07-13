import { getInventory } from '$lib/server/core';
import { DbProvider } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const inventory = await getInventory();
  return { args: inventory };
};