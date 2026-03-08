import { inventoryRepo } from '$lib/server/core';

import type { ShoppingListItem, ShoppingListSummary } from '$lib/types';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, parent }) => {
	const { workspace } = await parent();
	const { workspaceId } = workspace;

	const page = Number(url.searchParams.get('page') || '1');

	const productName = url.searchParams.get('productName') || '';
	const categoryGroupId = url.searchParams.get('categoryGroupId') || '';
	const supplierFilter = url.searchParams.get('supplierId') || '';
	const sort = url.searchParams.get('sort') || 'name-asc';

	const allowedPerPage = [20, 50, 100];
	let perPage = Number(url.searchParams.get('perPage')) || 20;
	if (!allowedPerPage.includes(perPage)) perPage = 20;

	let filter: Record<string, any> = {};
	if (productName) filter.productName = productName;
	if (categoryGroupId) filter.categoryGroupId = Number(categoryGroupId);
	if (supplierFilter) filter.supplierId = Number(supplierFilter);

	const [result, suppliers, stats, categories, totals] = await Promise.all([
		inventoryRepo.getShoppingList(
			workspaceId,
			page,
			perPage,
			Object.keys(filter).length > 0 ? filter : null,
			sort
		),
		inventoryRepo.getSuppliers(workspaceId),
		inventoryRepo.getStats(workspaceId),
		inventoryRepo.getCategoryBreakdown(workspaceId),
		inventoryRepo.getShoppingListTotals(workspaceId),
	]);

	const { data: items, pagination } = result;

	// enrich with impact scores
	const productIds = items.map((i) => i.productId);
	const impactMap = await inventoryRepo.getShoppingListImpact(workspaceId, productIds);

	const enriched: ShoppingListItem[] = items.map((item) => {
		const unlockable = impactMap.get(item.productId) || 0;
		const price = item.productPricePerUnit || 1;
		return {
			...item,
			unlockableRecipes: unlockable,
			impactScore: unlockable / price,
		};
	});

	// build summary from ALL out-of-stock (unfiltered totals)
	const summary: ShoppingListSummary = {
		totalItems: totals.totalItems,
		totalEstimatedCost: totals.totalCost,
		bySupplier: [],
		byCategory: [],
		totalRecipesUnlockable: enriched.reduce((sum, i) => sum + i.unlockableRecipes, 0),
	};

	return {
		items: enriched,
		pagination,
		suppliers,
		summary,
		stats,
		categories,
		filters: {
			search: productName,
			categoryGroupId,
			supplierId: supplierFilter,
			sort,
			page,
			perPage,
		},
	};
};
