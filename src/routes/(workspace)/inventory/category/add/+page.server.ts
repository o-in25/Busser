import { inventoryRepo } from '$lib/server/core';
import { canModifyWorkspace } from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { StatusCodes } from 'http-status-codes';

export const load: PageServerLoad = async ({ parent, locals }) => {
  const { workspace } = await parent();
  const workspaceId = workspace.workspaceId;

  // viewers cannot access add page
  if (!locals.user) {
    redirect(StatusCodes.SEE_OTHER, '/login');
  }
  const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
  if (!canModify) {
    redirect(StatusCodes.SEE_OTHER, '/inventory/category');
  }

  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const workspaceId = locals.activeWorkspaceId;
    if (!workspaceId || !locals.user) {
      return fail(StatusCodes.UNAUTHORIZED, { error: 'Workspace context required.' });
    }

    const canModify = await canModifyWorkspace(locals.user.userId, workspaceId);
    if (!canModify) {
      return fail(StatusCodes.FORBIDDEN, { error: 'You need editor or owner access to add categories.' });
    }

    const formData = await request.formData();

    const categoryName = formData.get('categoryName') as string;
    const categoryDescription = formData.get('categoryDescription') as string || '';

    if (!categoryName) {
      return fail(StatusCodes.BAD_REQUEST, { error: 'Category name is required.' });
    }

    const result = await inventoryRepo.createCategory(workspaceId, categoryName, categoryDescription);

    if (result.status === 'error') {
      return fail(StatusCodes.INTERNAL_SERVER_ERROR, { error: result.error });
    }

    redirect(StatusCodes.SEE_OTHER, '/inventory/category');
  }
};
