import { catalogRepo, inventoryRepo } from '$lib/server/core';
import { userRepo } from '$lib/server/auth';
import { getFavoriteRecipes } from '$lib/server/user-settings';
import { calculateOverallScore } from '$lib/math';
import type { AdvancedFilter } from '$lib/types';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, parent, locals }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const userId = locals.user?.userId;

	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = parseInt(url.searchParams.get('perPage') || '24');
	const search = url.searchParams.get('search') || '';
	const sort = url.searchParams.get('sort') || 'name-asc';
	const spiritId = url.searchParams.get('spirit') || '';
	const showFilter = url.searchParams.get('show') || ''; // 'favorites' | 'featured' | ''

	// advanced search params
	const readyToMake = url.searchParams.get('readyToMake') || '';
	const ingredient = url.searchParams.get('ingredient') || '';
	const strengthMin = url.searchParams.get('strengthMin') || '';
	const strengthMax = url.searchParams.get('strengthMax') || '';
	const ingredientCountMin = url.searchParams.get('ingredientCountMin') || '';
	const ingredientCountMax = url.searchParams.get('ingredientCountMax') || '';
	const method = url.searchParams.get('method') || '';
	const ratingMin = url.searchParams.get('ratingMin') || '';
	const ratingMax = url.searchParams.get('ratingMax') || '';

	// Build filter
	const filter: Record<string, any> = {};
	if (search) {
		filter.recipeName = search;
	}
	if (spiritId) {
		filter.recipeCategoryId = parseInt(spiritId);
	}

	// build advanced filter
	const advancedFilter: AdvancedFilter = {};
	if (readyToMake === '1') advancedFilter.readyToMake = true;
	if (ingredient) advancedFilter.ingredientProductId = parseInt(ingredient);
	if (strengthMin) advancedFilter.strengthMin = parseInt(strengthMin);
	if (strengthMax) advancedFilter.strengthMax = parseInt(strengthMax);
	if (ingredientCountMin) advancedFilter.ingredientCountMin = parseInt(ingredientCountMin);
	if (ingredientCountMax) advancedFilter.ingredientCountMax = parseInt(ingredientCountMax);
	if (method) advancedFilter.preparationMethodId = parseInt(method);
	if (ratingMin) advancedFilter.ratingMin = parseFloat(ratingMin);
	if (ratingMax) advancedFilter.ratingMax = parseFloat(ratingMax);

	const hasAdvancedFilter = Object.keys(advancedFilter).length > 0;

	// Get recipes, spirits, favorites, featured, preparation methods, and ingredient name in parallel
	const [catalogResult, spirits, userFavorites, favoriteRecipes, featuredRecipes, prepMethodsResult, ingredientProduct] =
		await Promise.all([
			catalogRepo.findAll(
				workspaceId,
				page,
				perPage,
				Object.keys(filter).length > 0 ? filter : null,
				hasAdvancedFilter ? advancedFilter : null
			),
			catalogRepo.getSpirits(),
			userId ? userRepo.getFavorites(userId, workspaceId) : Promise.resolve([]),
			userId ? getFavoriteRecipes(userId, workspaceId) : Promise.resolve([]),
			catalogRepo.getFeatured(workspaceId),
			catalogRepo.getPreparationMethods(),
			ingredient ? inventoryRepo.findById(workspaceId, parseInt(ingredient)) : Promise.resolve(null),
		]);

	let { data, pagination } = catalogResult;
	const preparationMethods = prepMethodsResult.status === 'success' ? (prepMethodsResult.data ?? []) : [];

	// Build sets for quick lookup
	const favoriteRecipeIds = new Set(userFavorites.map((f) => f.recipeId));
	const featuredRecipeIds = new Set(featuredRecipes.map((f) => f.recipeId));

	// Apply show filter (favorites/featured)
	if (showFilter === 'favorites') {
		// Use the actual favorite recipes, not filtered paginated results
		data = favoriteRecipes;
		pagination = {
			...pagination,
			total: favoriteRecipes.length,
			lastPage: 1,
			currentPage: 1,
		};
	} else if (showFilter === 'featured') {
		// Use the actual featured recipes, not filtered paginated results
		data = featuredRecipes;
		pagination = {
			...pagination,
			total: featuredRecipes.length,
			lastPage: 1,
			currentPage: 1,
		};
	}

	// Apply rating post-filter (score formula is too complex for SQL)
	if (advancedFilter.ratingMin !== undefined || advancedFilter.ratingMax !== undefined) {
		data = data.filter((recipe) => {
			const score = calculateOverallScore(
				recipe.recipeVersatilityRating,
				recipe.recipeSweetnessRating,
				recipe.recipeDrynessRating,
				recipe.recipeStrengthRating
			);
			if (advancedFilter.ratingMin !== undefined && score < advancedFilter.ratingMin) return false;
			if (advancedFilter.ratingMax !== undefined && score > advancedFilter.ratingMax) return false;
			return true;
		});
		pagination = {
			...pagination,
			total: data.length,
			lastPage: Math.max(1, Math.ceil(data.length / perPage)),
		};
	}

	// Apply client-side sorting
	switch (sort) {
		case 'name-asc':
			data.sort((a, b) => a.recipeName.localeCompare(b.recipeName));
			break;
		case 'name-desc':
			data.sort((a, b) => b.recipeName.localeCompare(a.recipeName));
			break;
		case 'top-rated':
			data.sort((a, b) => {
				const scoreA = calculateOverallScore(
					a.recipeVersatilityRating,
					a.recipeSweetnessRating,
					a.recipeDrynessRating,
					a.recipeStrengthRating
				);
				const scoreB = calculateOverallScore(
					b.recipeVersatilityRating,
					b.recipeSweetnessRating,
					b.recipeDrynessRating,
					b.recipeStrengthRating
				);
				return scoreB - scoreA; // Descending (highest first)
			});
			break;
		case 'newest':
			data.sort((a, b) => b.recipeId - a.recipeId);
			break;
		case 'oldest':
			data.sort((a, b) => a.recipeId - b.recipeId);
			break;
	}

	return {
		recipes: data,
		pagination,
		spirits,
		preparationMethods,
		favoriteRecipeIds: [...favoriteRecipeIds],
		featuredRecipeIds: [...featuredRecipeIds],
		filters: {
			search,
			sort,
			spiritId,
			showFilter,
			page,
			readyToMake,
			ingredient,
			ingredientName: ingredientProduct?.productName || '',
			strengthMin,
			strengthMax,
			ingredientCountMin,
			ingredientCountMax,
			method,
			ratingMin,
			ratingMax,
		},
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
