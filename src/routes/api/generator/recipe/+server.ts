import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RecipeGenerator } from '$lib/server/generators/recipe-generator';
import { StatusCodes } from 'http-status-codes';

export const POST: RequestHandler = async ({ request, locals }) => {
  if (!locals.activeWorkspaceId) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: 'Unauthorized',
      code: StatusCodes.UNAUTHORIZED,
      message: 'Workspace context required'
    });
  }

  const body = await request.json();
  const generator = new RecipeGenerator();
  const result = await generator.generateContent(body.recipeName);
  return json(result);
};