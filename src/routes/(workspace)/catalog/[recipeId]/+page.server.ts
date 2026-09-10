import { error } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { catalogRepo } from '$lib/server/core';
import { userRepo } from '$lib/server/auth';
import { canModifyWorkspace, getUserWorkspaces, getGlobalWorkspace } from '$lib/server/workspace';
import { roleCanModify } from '$lib/types/workspace';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, locals }) => {
	const globalWorkspace = getGlobalWorkspace();
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const { recipeId } = params;
	const userId = locals.user?.userId;

	const canModify = roleCanModify(workspace.workspaceRole);

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

	// these don't depend on each other — fan them out
	const [stepExtras, isFavorite, isFeatured] = await Promise.all([
		catalogRepo.getStepExtras(workspaceId, result.data.recipeSteps),
		userId ? userRepo.isFavorite(userId, Number(recipeId)) : Promise.resolve(false),
		catalogRepo.isFeatured(workspaceId, Number(recipeId)),
	]);

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

		const editableWorkspaces = allWorkspaces
			.filter((w) => w.workspaceId !== globalWorkspace)
			.filter((w) => roleCanModify(w.workspaceRole))
			.map((w) => ({ workspaceId: w.workspaceId, workspaceName: w.workspaceName }));

		// check which workspaces already have this recipe imported — fan out per workspace
		if (editableWorkspaces.length > 0) {
			const checks = await Promise.all(
				editableWorkspaces.map(async (ws) => {
					const [imported, nameMatch] = await Promise.all([
						catalogRepo.findImportedRecipe(ws.workspaceId, Number(recipeId), globalWorkspace),
						catalogRepo.findByName(ws.workspaceId, result.data!.recipe.recipeName),
					]);
					return { workspaceId: ws.workspaceId, imported: !!imported, nameMatch: !!nameMatch };
				})
			);

			const importedTo = checks.filter((c) => c.imported).map((c) => c.workspaceId);
			const nameCollisions = checks.filter((c) => c.nameMatch).map((c) => c.workspaceId);

			const eligible = result.data.recipeSteps.every(
				(s) => s.matchMode === 'ANY_IN_CATEGORY' || s.matchMode === 'ANY_IN_PARENT_CATEGORY'
			);

			importData = { editableWorkspaces, importedTo, nameCollisions, eligible };
		}
	}

	const isOwned = result.data.recipe.workspaceId === workspaceId;

	const [ownedSameName, sourceUpdate] = await Promise.all([
		!!userId && !isOwned
			? catalogRepo.findByName(workspaceId, result.data.recipe.recipeName).then((r) => !!r)
			: Promise.resolve(false),
		isOwned && result.data.recipe.sourceRecipeId
			? catalogRepo.getSourceUpdate(workspaceId, Number(recipeId))
			: Promise.resolve(null),
	]);

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
		ownedSameName,
		sourceUpdate,
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

	syncFork: async ({ request, locals }) => {
		const userId = locals.user?.userId;
		const workspaceId = locals.activeWorkspaceId;
		if (!userId || !workspaceId) return { success: false, error: 'Not authenticated' };

		const recipeId = Number((await request.formData()).get('recipeId'));
		if (!recipeId) return { success: false, error: 'Missing recipe.' };

		if (!(await canModifyWorkspace(userId, workspaceId))) {
			return { success: false, error: 'Only editors and owners can update recipes.' };
		}

		const result = await catalogRepo.resyncFork(workspaceId, recipeId);
		if (result.status === 'error') return { success: false, error: result.error };
		return { success: true, synced: true };
	},

	dismissUpdate: async ({ request, locals }) => {
		const userId = locals.user?.userId;
		const workspaceId = locals.activeWorkspaceId;
		if (!userId || !workspaceId) return { success: false, error: 'Not authenticated' };

		const recipeId = Number((await request.formData()).get('recipeId'));
		if (!recipeId) return { success: false, error: 'Missing recipe.' };

		if (!(await canModifyWorkspace(userId, workspaceId))) {
			return { success: false, error: 'Only editors and owners can update recipes.' };
		}

		const result = await catalogRepo.dismissSourceUpdate(workspaceId, recipeId);
		if (result.status === 'error') return { success: false, error: result.error };
		return { success: true, dismissed: true };
	},
};
