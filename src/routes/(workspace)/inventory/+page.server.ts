import { inventoryRepo } from '$lib/server/core';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, parent }) => {
	// get workspace from parent layout
	const { workspace } = await parent();
	const { workspaceId } = workspace;

	const page = Number(url.searchParams.get('page') || '1');

	const productName = url.searchParams.get('productName') || '';
	const categoryGroupId = url.searchParams.get('categoryGroupId') || '';
	const stockFilter = url.searchParams.get('stockFilter') || '';
	const sort = url.searchParams.get('sort') || 'name-asc';

	const allowedPerPage = [20, 50, 100];
	let perPage = Number(url.searchParams.get('perPage')) || 20;
	if (!allowedPerPage.includes(perPage)) perPage = 20;

	// Build filter object
	let filter: Record<string, any> = {};
	if (productName) {
		filter.productName = productName;
	}
	if (categoryGroupId) {
		filter.categoryGroupId = Number(categoryGroupId);
	}
	if (stockFilter) {
		filter.stockFilter = stockFilter;
	}

	// Fetch all data in parallel
	const [inventoryResult, stats, categories] = await Promise.all([
		inventoryRepo.findAll(
			workspaceId,
			page,
			perPage,
			Object.keys(filter).length > 0 ? filter : null,
			sort
		),
		inventoryRepo.getStats(workspaceId),
		inventoryRepo.getCategoryBreakdown(workspaceId),
	]);

	const { data, pagination } = inventoryResult;

	// Get recipe usage for the current page's products
	const productIds = data.map((p) => p.productId).filter((id): id is number => id !== null);
	const recipeUsageMap = await inventoryRepo.getRecipeUsage(workspaceId, productIds);

	// Convert Map to plain object for serialization
	const recipeUsage: Record<number, number> = {};
	recipeUsageMap.forEach((count, productId) => {
		recipeUsage[productId] = count;
	});

	// Get recently added items (highest productId = most recent)
	const recentlyAdded = [...data]
		.sort((a, b) => (b.productId || 0) - (a.productId || 0))
		.slice(0, 6);

	return {
		data,
		pagination,
		stats,
		categories,
		recipeUsage,
		recentlyAdded,
		filters: {
			search: productName,
			categoryGroupId,
			stockFilter,
			sort,
			page,
			perPage,
		},
	};
};
