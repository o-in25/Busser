import { error } from '@sveltejs/kit';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { spirits, slugToId } from '$lib/spirits';
import { catalogRepo } from '$lib/server/core';
import { userRepo } from '$lib/server/auth';
import type { View, SpiritSlug } from '$lib/types';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, parent, locals }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const slug = params.spirit as SpiritSlug;
	const userId = locals.user?.userId;

	const recipeCategoryId = slugToId[slug];
	const spiritContent = spirits[slug];

	// number of recipes shown in the preview strip; the rest live in the filtered catalog
	const PREVIEW_LIMIT = 6;

	// get spirits, favorites, featured, and this category's recipes in parallel
	const [allSpirits, userFavorites, featuredRecipes, categoryRecipes] = await Promise.all([
		catalogRepo.getSpirits(),
		userId ? userRepo.getFavorites(userId, workspaceId) : Promise.resolve([]),
		catalogRepo.getFeatured(workspaceId),
		catalogRepo.getRecipesByCategory(workspaceId, recipeCategoryId),
	]);

	const spirit = allSpirits.find((s) => s.recipeCategoryId === recipeCategoryId);

	if (!spirit) {
		error(StatusCodes.NOT_FOUND, {
			reason: getReasonPhrase(StatusCodes.NOT_FOUND),
			code: StatusCodes.NOT_FOUND,
			message: 'Category not found.',
		});
	}

	const allCategoryRecipes =
		categoryRecipes.status === 'success' ? (categoryRecipes.data ?? []) : [];

	// build sets for quick lookup
	const favoriteRecipeIds = new Set(userFavorites.map((f) => f.recipeId));
	const featuredRecipeIds = new Set(featuredRecipes.map((f) => f.recipeId));

	// preview strip: featured-first, then alphabetical, capped at PREVIEW_LIMIT
	const previewRecipes = [...allCategoryRecipes]
		.sort((a, b) => {
			const aFeatured = featuredRecipeIds.has(a.recipeId) ? 0 : 1;
			const bFeatured = featuredRecipeIds.has(b.recipeId) ? 0 : 1;
			if (aFeatured !== bFeatured) return aFeatured - bFeatured;
			return (a.recipeName ?? '').localeCompare(b.recipeName ?? '');
		})
		.slice(0, PREVIEW_LIMIT) as View.BasicRecipe[];

	// spotlight image: prefer the category's own image, then a featured recipe, then any category recipe
	const featuredInCategory = featuredRecipes.find(
		(r) => r.recipeCategoryId === recipeCategoryId && r.recipeImageUrl
	);
	const spotlightImage =
		spirit.recipeCategoryDescriptionImageUrl ??
		featuredInCategory?.recipeImageUrl ??
		allCategoryRecipes.find((r) => r.recipeImageUrl)?.recipeImageUrl ??
		null;

	// lightweight full list for seo (json-ld + noscript) — names/urls only, no card payload
	const recipeIndex = allCategoryRecipes
		.map((r) => ({ recipeId: r.recipeId, recipeName: r.recipeName ?? '' }))
		.sort((a, b) => a.recipeName.localeCompare(b.recipeName));

	return {
		spirit,
		recipes: previewRecipes,
		recipeIndex,
		totalCount: allCategoryRecipes.length,
		favoriteRecipeIds: [...favoriteRecipeIds],
		featuredRecipeIds: [...featuredRecipeIds],
		spotlightImage,
		spiritContent,
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

		const result = await catalogRepo.toggleFeatured(workspaceId, recipeId);

		if (result.status === 'error') {
			return { success: false, error: result.error };
		}

		return { success: true, isFeatured: result.data?.isFeatured };
	},
};
