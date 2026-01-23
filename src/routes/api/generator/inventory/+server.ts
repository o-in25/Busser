import type { RequestHandler } from './$types';
import { InventoryGenerator } from '$lib/server/generators/inventory-generator';
import { json, error } from '@sveltejs/kit';
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
  const generator = new InventoryGenerator();
  const result = await generator.generateContent(body.trigger);
  return json(result);
};