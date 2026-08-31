import { error } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { catalogRepo } from '$lib/server/core';
import { userRepo } from '$lib/server/auth';
import { canModifyWorkspace, getUserWorkspaces, getGlobalWorkspace } from '$lib/server/workspace';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, locals }) => {
	// per-request, not module-load — a top-level call throws at build
	const globalWorkspace = getGlobalWorkspace();
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const { recipeId } = params;
	const userId = locals.user?.userId;

	// owners/editors can view + manage drafts; viewers get a 404 on unpublished
	const canModify = workspace.workspaceRole === 'owner' || workspace.workspaceRole === 'editor';

	if (!recipeId || isNaN(Number(recipeId))) {
		error(StatusCodes.BAD_REQUEST, {
			reason: getReasonPhrase(StatusCodes.BAD_REQUEST),
			code: StatusCodes.BAD_REQUEST,
			message: 'Invalid recipe ID.',
		});
	}

	const result = await catalogRepo.findById(workspaceId, recipeId, canModify);

	if (result.status === 'error' || !result.data) {
		error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'Recipe not found.',
		});
	}

	// per-step images + inventory-backed substitutes for the workspace
	const stepExtras = await catalogRepo.getStepExtras(workspaceId, result.data.recipeSteps);

	const isFavorite = userId ? await userRepo.isFavorite(userId, Number(recipeId)) : false;
	const isFeatured = await catalogRepo.isFeatured(workspaceId, Number(recipeId));

	// import context: only when viewing global catalog as a non-admin authenticated user
	let importData: {
		editableWorkspaces: { workspaceId: string; workspaceName: string }[];
		importedTo: string[];
		nameCollisions: string[];
		eligible: boolean;
	} | null = null;

	const isGlobalCatalog = workspaceId === globalWorkspace;

	if (userId && isGlobalCatalog) {
		const wsResult = await getUserWorkspaces(userId);
		const allWorkspaces = wsResult.status === 'success' ? (wsResult.data ?? []) : [];

		// editable workspaces excluding global catalog
		const editableWorkspaces = allWorkspaces
			.filter((w) => w.workspaceId !== globalWorkspace)
			.filter((w) => w.workspaceRole === 'owner' || w.workspaceRole === 'editor')
			.map((w) => ({ workspaceId: w.workspaceId, workspaceName: w.workspaceName }));

		if (editableWorkspaces.length > 0) {
			// check which workspaces already have this recipe imported
			const importedTo: string[] = [];
			const nameCollisions: string[] = [];

			for (const ws of editableWorkspaces) {
				const imported = await catalogRepo.findImportedRecipe(
					ws.workspaceId,
					Number(recipeId),
					globalWorkspace
				);
				if (imported) importedTo.push(ws.workspaceId);

				const nameMatch = await catalogRepo.findByName(
					ws.workspaceId,
					result.data.recipe.recipeName
				);
				if (nameMatch) nameCollisions.push(ws.workspaceId);
			}

			// eligibility: all steps must use category matching
			const eligible = result.data.recipeSteps.every(
				(s) => s.matchMode === 'ANY_IN_CATEGORY' || s.matchMode === 'ANY_IN_PARENT_CATEGORY'
			);

			importData = { editableWorkspaces, importedTo, nameCollisions, eligible };
		}
	}

	// a recipe surfaced via the union but owned by the global catalog can only be customized (forked), not edited in place
	const isOwned = result.data.recipe.workspaceId === workspaceId;

	return {
		recipe: result.data.recipe,
		recipeSteps: result.data.recipeSteps,
		stepExtras,
		isFavorite,
		isFeatured,
		importData,
		canModify,
		isGlobalCatalog,
		isOwned,
	};
};

export const actions: Actions = {
	toggleFavorite: async ({ request, locals }) => {
		const userId = locals.user?.userId;
		if (!userId) {
			return { success: false, error: 'Not authenticated' };
		}

		const formData = await request.formData();
		const recipeId = Number(formData.get('recipeId'));
		const workspaceId = formData.get('workspaceId') as string;

		if (!recipeId || !workspaceId) {
			return { success: false, error: 'Missing required fields' };
		}

		const result = await userRepo.toggleFavorite(userId, recipeId, workspaceId);

		if (result.status === 'error') {
			return { success: false, error: result.error };
		}

		return { success: true, isFavorite: result.data?.isFavorite };
	},

	toggleFeatured: async ({ request, locals }) => {
		const userId = locals.user?.userId;
		if (!userId) {
			return { success: false, error: 'Not authenticated' };
		}

		const formData = await request.formData();
		const recipeId = Number(formData.get('recipeId'));
		const workspaceId = formData.get('workspaceId') as string;

		if (!recipeId || !workspaceId) {
			return { success: false, error: 'Missing required fields' };
		}

		const canModify = await canModifyWorkspace(userId, workspaceId);
		if (!canModify) {
			return { success: false, error: 'Only editors and owners can feature recipes' };
		}

		const result = await catalogRepo.toggleFeatured(workspaceId, recipeId);

		if (result.status === 'error') {
			return { success: false, error: result.error };
		}

		return { success: true, isFeatured: result.data?.isFeatured };
	},

	togglePublished: async ({ request, locals }) => {
		const userId = locals.user?.userId;
		if (!userId) {
			return { success: false, error: 'Not authenticated' };
		}

		const formData = await request.formData();
		const recipeId = Number(formData.get('recipeId'));
		const workspaceId = formData.get('workspaceId') as string;

		if (!recipeId || !workspaceId) {
			return { success: false, error: 'Missing required fields' };
		}

		const canModify = await canModifyWorkspace(userId, workspaceId);
		if (!canModify) {
			return { success: false, error: 'Only editors and owners can publish recipes' };
		}

		const result = await catalogRepo.togglePublished(workspaceId, recipeId);

		if (result.status === 'error') {
			return { success: false, error: result.error };
		}

		return { success: true, published: result.data?.published };
	},

	importToWorkspace: async ({ request, locals }) => {
		const userId = locals.user?.userId;
		if (!userId) {
			return { success: false, error: 'Not authenticated' };
		}

		const globalWorkspace = getGlobalWorkspace();
		const formData = await request.formData();
		const recipeId = Number(formData.get('recipeId'));
		const sourceWorkspaceId = formData.get('sourceWorkspaceId') as string;
		const targetWorkspaceId = formData.get('targetWorkspaceId') as string;

		if (!recipeId || !sourceWorkspaceId || !targetWorkspaceId) {
			return { success: false, error: 'Missing required fields' };
		}

		// only allow importing from global catalog for now
		if (sourceWorkspaceId !== globalWorkspace) {
			return { success: false, error: 'Importing is only supported from the global catalog' };
		}

		// verify user can edit the target workspace
		const canModify = await canModifyWorkspace(userId, targetWorkspaceId);
		if (!canModify) {
			return { success: false, error: 'You do not have permission to import to this workspace' };
		}

		const result = await catalogRepo.importRecipe(targetWorkspaceId, recipeId, sourceWorkspaceId);

		if (result.status === 'error') {
			return { success: false, error: result.error };
		}

		return {
			success: true,
			alreadyImported: result.data?.alreadyImported || false,
			importedRecipeId: result.data?.recipe.recipeId,
			targetWorkspaceId,
		};
	},
};
