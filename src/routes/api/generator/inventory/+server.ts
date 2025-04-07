import type { RequestHandler } from './$types';
import { InventoryGenerator } from '$lib/server/generators/inventory-generator';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const generator = new InventoryGenerator();
  const result = await generator.generateContent(body.productName)
    return json(result);
};