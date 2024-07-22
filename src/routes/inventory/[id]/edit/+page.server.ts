import { findInventoryItem } from '$lib/server/core';
import type { PageServerLoad } from './$types';

export const load = (async ({ request, params }) => {
  const { id } = params;
  const product = await findInventoryItem(Number(id));
  return { args: { product } };
}) satisfies PageServerLoad;