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

	const canModify = roleCanModify(workspace.workspaceRole);
	const page = parseInt(url.searchParams.get('page') || '1');
	const perPage = parseInt(url.searchParams.get('perPage') || '24');
	const search = url.searchParams.get('search') || '';
	const sort = url.searchParams.get('sort') || 'name-asc';
	const spiritId = url.searchParams.get('spirit') || '';
	const showFilter = url.searchParams.get('show') || ''; // 'favorites' | 'featured' | ''
	const mood = url.searchParams.get('mood') || '';
	const makeableLensAvailable = canModify;
	// single mutually-exclusive make axis: 'ready' | 'almost' | '' (all)
	const makeFilter = makeableLensAvailable ? url.searchParams.get('make') || '' : '';
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
	if (draftsView) {
		filter.published = false;
	}

	const advancedFilter: AdvancedFilter = {};
	if (makeFilter === 'ready') advancedFilter.readyToMake = true;
	if (makeFilter === 'almost') advancedFilter.almostThere = true;
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
		almostThereIds,
		stackTotalRaw,
		...ingredientEntries
	] = await Promise.all([
		catalogRepo.findAll(
			workspaceId,
			page,
			perPage,
			Object.keys(filter).length > 0 ? filter : null,
			hasAdvancedFilter ? advancedFilter : null,
			draftsView,
			sort
		),
		catalogRepo.getSpirits(),
		userId ? userRepo.getFavorites(userId, workspaceId) : Promise.resolve([]),
		userId ? getFavoriteRecipes(userId, workspaceId) : Promise.resolve([]),
		catalogRepo.getFeatured(workspaceId),
		catalogRepo.getPreparationMethods(),
		catalogRepo.getAvailableRecipes(workspaceId),
		catalogRepo.getAlmostThereIds(workspaceId),
		// favorites/featured totals come from their loaded arrays; all/drafts need a count query
		showFilter === 'favorites' || showFilter === 'featured'
			? Promise.resolve(0)
			: catalogRepo.countStack(workspaceId, draftsView),
		...ingredientNameLookups,
	]);

	const availableIds = new Set(
		availableResult.status === 'success' ? (availableResult.data ?? []).map((r) => r.recipeId) : []
	);
	const almostIds = new Set(almostThereIds);

	// make badges (all/ready/almost) are scoped to the active show stack
	let stackTotal: number;
	let readyCount: number;
	let almostThereCount: number;
	if (showFilter === 'favorites' || showFilter === 'featured') {
		const stackIds = (showFilter === 'favorites' ? favoriteRecipes : featuredRecipes).map(
			(r) => r.recipeId
		);
		stackTotal = stackIds.length;
		readyCount = stackIds.filter((id) => availableIds.has(id)).length;
		almostThereCount = stackIds.filter((id) => almostIds.has(id)).length;
	} else if (draftsView) {
		// drafts are unpublished, so never ready/almost (both id sets are published-only)
		stackTotal = stackTotalRaw;
		readyCount = 0;
		almostThereCount = 0;
	} else {
		stackTotal = stackTotalRaw;
		readyCount = availableIds.size;
		almostThereCount = almostIds.size;
	}

	const ingredientNames = Object.fromEntries(ingredientEntries) as Record<number, string>;

	let { data, pagination } = catalogResult;
	const preparationMethods =
		prepMethodsResult.status === 'success' ? (prepMethodsResult.data ?? []) : [];

	const favoriteRecipeIds = new Set(userFavorites.map((f) => f.recipeId));
	const featuredRecipeIds = new Set(featuredRecipes.map((f) => f.recipeId));

	const isReplacedView = showFilter === 'favorites' || showFilter === 'featured';
	if (isReplacedView) {
		data = showFilter === 'favorites' ? favoriteRecipes : featuredRecipes;
		// the replaced list bypasses findAll, so apply the make filter here to match the grid
		if (makeFilter === 'ready') data = data.filter((r) => availableIds.has(r.recipeId));
		else if (makeFilter === 'almost') data = data.filter((r) => almostIds.has(r.recipeId));
		pagination = { ...pagination, total: data.length, lastPage: 1, currentPage: 1 };

		const scoreOf = (r: (typeof data)[number]) =>
			calculateOverallScore(
				r.recipeVersatilityRating,
				r.recipeSweetnessRating,
				r.recipeDrynessRating,
				r.recipeStrengthRating
			);

		if (advancedFilter.ratingMin !== undefined || advancedFilter.ratingMax !== undefined) {
			data = data.filter((r) => {
				const score = scoreOf(r);
				if (advancedFilter.ratingMin !== undefined && score < advancedFilter.ratingMin)
					return false;
				if (advancedFilter.ratingMax !== undefined && score > advancedFilter.ratingMax)
					return false;
				return true;
			});
			pagination = { ...pagination, total: data.length };
		}

		switch (sort) {
			case 'name-desc':
				data.sort((a, b) => b.recipeName.localeCompare(a.recipeName));
				break;
			case 'top-rated':
				data.sort((a, b) => scoreOf(b) - scoreOf(a));
				break;
			case 'newest':
				data.sort((a, b) => b.recipeId - a.recipeId);
				break;
			case 'oldest':
				data.sort((a, b) => a.recipeId - b.recipeId);
				break;
			default:
				data.sort((a, b) => a.recipeName.localeCompare(b.recipeName));
		}
	}

	return {
		recipes: data,
		pagination,
		spirits,
		preparationMethods,
		canModify,
		stackTotal,
		readyCount,
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
			make: makeFilter,
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
