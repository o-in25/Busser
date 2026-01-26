import { inventoryRepo } from '$lib/server/core';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes } from 'http-status-codes';

export const load: PageServerLoad = async ({ url, parent }) => {
  // get workspace from parent layout
  const { workspace } = await parent();
  const workspaceId = workspace.workspaceId;

  // redirect to page 1
  if(!url.searchParams.size) {
    throw redirect(StatusCodes.TEMPORARY_REDIRECT, url.pathname.concat('?', 'page=1'));
  }

  let page: string | number = url.searchParams.get('page') || '1';
  page = Number(page);

  const productName = url.searchParams.get('productName') || '';
  const categoryId = url.searchParams.get('categoryId') || '';
  const stockFilter = url.searchParams.get('stockFilter') || '';

  // Build filter object
  let filter: Record<string, any> = {};
  if(productName) {
    filter.productName = productName;
  }
  if(categoryId) {
    filter.categoryId = Number(categoryId);
  }
  if(stockFilter) {
    filter.stockFilter = stockFilter;
  }

  // Fetch all data in parallel
  const [inventoryResult, stats, categories] = await Promise.all([
    inventoryRepo.findAll(workspaceId, page, 20, Object.keys(filter).length > 0 ? filter : null),
    inventoryRepo.getStats(workspaceId),
    inventoryRepo.getCategoryBreakdown(workspaceId)
  ]);

  const { data, pagination } = inventoryResult;

  // Get recipe usage for the current page's products
  const productIds = data.map(p => p.productId).filter((id): id is number => id !== null);
  const recipeUsageMap = await inventoryRepo.getRecipeUsage(workspaceId, productIds);

  // Convert Map to plain object for serialization
  const recipeUsage: Record<number, number> = {};
  recipeUsageMap.forEach((count, productId) => {
    recipeUsage[productId] = count;
  });

  // Get out-of-stock and low-stock items for alerts (limit to 10 each)
  const outOfStockItems = data.filter(p => p.productInStockQuantity === 0).slice(0, 5);
  const lowStockItems = data.filter(p => p.productInStockQuantity === 1).slice(0, 5);

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
    outOfStockItems,
    lowStockItems,
    recentlyAdded,
    filters: {
      search: productName,
      categoryId,
      stockFilter,
      page
    }
  };
};
