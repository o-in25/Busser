import { catalogRepo, inventoryRepo } from '$lib/server/core';
import { userRepo } from '$lib/server/auth';
import { getFavoriteRecipes } from '$lib/server/user-settings';
import { roleCanModify } from '$lib/types/workspace';
import { calculateOverallScore } from '$lib/math';
import type { AdvancedFilter } from '$lib/types';

import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, parent, locals }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;
	const userId = locals.user?.userId;

	// owners/editors see drafts
	const canModify = roleCanModify(workspace.workspaceRole);

	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = parseInt(url.searchParams.get('perPage') || '24');
	const search = url.searchParams.get('search') || '';
	const sort = url.searchParams.get('sort') || 'name-asc';
	const spiritId = url.searchParams.get('spirit') || '';
	const showFilter = url.searchParams.get('show') || ''; // 'favorites' | 'featured' | ''
	const mood = url.searchParams.get('mood') || '';

	// makeability lens is an operator tool — whoever can modify the workspace (owner/editor) gets it
	const makeableLensAvailable = canModify;
	const readyToMakeActive = makeableLensAvailable && url.searchParams.get('readyToMake') === '1';

	// drafts live behind the Show filter (owner/editor only) so the default catalog reads as
	// published-only — matching the home count. everyone else always sees published.
	const draftsView = canModify && showFilter === 'drafts';

	const ingredientInclude = url.searchParams.get('ingredientInclude') || '';
	const ingredientAny = url.searchParams.get('ingredientAny') || '';
	const ingredientExclude = url.searchParams.get('ingredientExclude') || '';
	const strengthMin = url.searchParams.get('strengthMin') || '';
	const strengthMax = url.searchParams.get('strengthMax') || '';
	const ingredientCountMin = url.searchParams.get('ingredientCountMin') || '';
	const ingredientCountMax = url.searchParams.get('ingredientCountMax') || '';
	const method = url.searchParams.get('method') || '';
	const ratingMin = url.searchParams.get('ratingMin') || '';
	const ratingMax = url.searchParams.get('ratingMax') || '';

	const parseIds = (ids: string) =>
		ids
			? ids
					.split(',')
					.map(Number)
					.filter((n) => !isNaN(n) && n > 0)
			: [];
	const includeIds = parseIds(ingredientInclude);
	const anyIds = parseIds(ingredientAny);
	const excludeIds = parseIds(ingredientExclude);

	const filter: Record<string, any> = {};
	if (search) {
		filter.recipeName = search;
	}
	if (spiritId) {
		filter.recipeCategoryId = parseInt(spiritId);
	}
	// drafts view narrows to unpublished; everything else stays published-only via includeUnpublished
	if (draftsView) {
		filter.published = false;
	}

	const advancedFilter: AdvancedFilter = {};
	if (readyToMakeActive) advancedFilter.readyToMake = true;
	if (includeIds.length) advancedFilter.ingredientInclude = includeIds;
	if (anyIds.length) advancedFilter.ingredientAny = anyIds;
	if (excludeIds.length) advancedFilter.ingredientExclude = excludeIds;
	if (strengthMin) advancedFilter.strengthMin = parseInt(strengthMin);
	if (strengthMax) advancedFilter.strengthMax = parseInt(strengthMax);
	if (ingredientCountMin) advancedFilter.ingredientCountMin = parseInt(ingredientCountMin);
	if (ingredientCountMax) advancedFilter.ingredientCountMax = parseInt(ingredientCountMax);
	if (method) advancedFilter.preparationMethodId = parseInt(method);
	if (ratingMin) advancedFilter.ratingMin = parseFloat(ratingMin);
	if (ratingMax) advancedFilter.ratingMax = parseFloat(ratingMax);
	if (mood) advancedFilter.mood = mood;

	const hasAdvancedFilter = Object.keys(advancedFilter).length > 0;

	const allIngredientIds = [...new Set([...includeIds, ...anyIds, ...excludeIds])];
	const ingredientNameLookups = allIngredientIds.map((id) =>
		inventoryRepo.findById(workspaceId, id).then((p) => [id, p?.productName || String(id)] as const)
	);

	const [
		catalogResult,
		spirits,
		userFavorites,
		favoriteRecipes,
		featuredRecipes,
		prepMethodsResult,
		availableResult,
		almostThereRecipes,
		...ingredientEntries
	] = await Promise.all([
		catalogRepo.findAll(
			workspaceId,
			page,
			perPage,
			Object.keys(filter).length > 0 ? filter : null,
			hasAdvancedFilter ? advancedFilter : null,
			draftsView
		),
		catalogRepo.getSpirits(),
		userId ? userRepo.getFavorites(userId, workspaceId) : Promise.resolve([]),
		userId ? getFavoriteRecipes(userId, workspaceId) : Promise.resolve([]),
		catalogRepo.getFeatured(workspaceId),
		catalogRepo.getPreparationMethods(),
		catalogRepo.getAvailableRecipes(workspaceId),
		catalogRepo.getAlmostThereRecipes(workspaceId),
		...ingredientNameLookups,
	]);

	const availableCount =
		availableResult.status === 'success' ? (availableResult.data?.length ?? 0) : 0;
	const almostThereCount = almostThereRecipes.length;

	const ingredientNames = Object.fromEntries(ingredientEntries) as Record<number, string>;

	let { data, pagination } = catalogResult;
	const preparationMethods =
		prepMethodsResult.status === 'success' ? (prepMethodsResult.data ?? []) : [];

	const favoriteRecipeIds = new Set(userFavorites.map((f) => f.recipeId));
	const featuredRecipeIds = new Set(featuredRecipes.map((f) => f.recipeId));

	if (showFilter === 'favorites') {
		data = favoriteRecipes;
		pagination = {
			...pagination,
			total: favoriteRecipes.length,
			lastPage: 1,
			currentPage: 1,
		};
	} else if (showFilter === 'featured') {
		data = featuredRecipes;
		pagination = {
			...pagination,
			total: featuredRecipes.length,
			lastPage: 1,
			currentPage: 1,
		};
	}

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
				return scoreB - scoreA;
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
		canModify,
		availableCount,
		almostThereCount,
		makeableLensAvailable,
		favoriteRecipeIds: [...favoriteRecipeIds],
		featuredRecipeIds: [...featuredRecipeIds],
		filters: {
			search,
			sort,
			spiritId,
			showFilter,
			mood,
			page,
			perPage,
			readyToMake: readyToMakeActive ? '1' : '',
			ingredientInclude,
			ingredientAny,
			ingredientExclude,
			ingredientNames,
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
