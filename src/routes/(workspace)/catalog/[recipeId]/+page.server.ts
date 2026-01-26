import { catalogRepo } from '$lib/server/core';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

export const load: PageServerLoad = async ({ params, parent }) => {
  const { workspace } = await parent();
  const workspaceId = workspace.workspaceId;
  const { recipeId } = params;

  if (!recipeId || isNaN(Number(recipeId))) {
    error(StatusCodes.BAD_REQUEST, {
      reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
      code: StatusCodes.BAD_REQUEST,
      message: 'Invalid recipe ID.'
    });
  }

  const result = await catalogRepo.findById(workspaceId, recipeId);

  if (result.status === 'error' || !result.data) {
    error(StatusCodes.NOT_FOUND, {
      reason: getReasonPhrase(StatusCodes.NOT_FOUND),
      code: StatusCodes.NOT_FOUND,
      message: 'Recipe not found.'
    });
  }

  return {
    recipe: result.data.recipe,
    recipeSteps: result.data.recipeSteps
  };
};
