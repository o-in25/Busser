import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RecipeGenerator } from '$lib/server/generators/recipe-generator';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const generator = new RecipeGenerator();
  const result = await generator.generateContent(body.recipeName)
    return json(result);
};