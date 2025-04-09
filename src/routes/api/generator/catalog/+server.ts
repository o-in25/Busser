import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CatalogGenerator } from '$lib/server/generators/catalog-generator';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const generator = new CatalogGenerator();
  const result = await generator.generateContent(body.recipeName)
    return json(result);
};