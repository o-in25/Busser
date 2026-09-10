// TODO: backwards compatibility layer
// new code should import from repositories directly
// these should be moved to their own repo

import { DbProvider } from './db';
import { CatalogRepository } from './repositories/catalog.repository';
import { InventoryRepository } from './repositories/inventory.repository';
import { env } from '$env/dynamic/private';
export { titleCase } from '$lib/utils';
const { CORE_TABLE } = env;

// singleton instances
const db = new DbProvider(CORE_TABLE || '');
const inventoryRepo = new InventoryRepository(db);
const catalogRepo = new CatalogRepository(db);

// inventory
export const getInventory = inventoryRepo.findAll.bind(inventoryRepo);
export const findInventoryItem = inventoryRepo.findById.bind(inventoryRepo);
export const addToInventory = inventoryRepo.create.bind(inventoryRepo);
export const updateInventory = inventoryRepo.update.bind(inventoryRepo);
export const deleteInventoryItem = inventoryRepo.delete.bind(inventoryRepo);
export const getInventoryStats = inventoryRepo.getStats.bind(inventoryRepo);
export const getProductCategories = inventoryRepo.getCategoryBreakdown.bind(inventoryRepo);
export const getRecipeUsageByProduct = inventoryRepo.getRecipeUsage.bind(inventoryRepo);
export const productSelect = inventoryRepo.getProductOptions.bind(inventoryRepo);
export const categorySelect = inventoryRepo.getCategoryOptions.bind(inventoryRepo);
export const seedBaselineInventory = inventoryRepo.seedInventory.bind(inventoryRepo);
export const getCategory = inventoryRepo.findCategoryById.bind(inventoryRepo);
export const addCategory = inventoryRepo.createCategory.bind(inventoryRepo);
export const updateCategory = inventoryRepo.updateCategory.bind(inventoryRepo);
export const getSubcategories = inventoryRepo.findSubcategories.bind(inventoryRepo);
export const getProductsByCategory = inventoryRepo.findProductsByCategory.bind(inventoryRepo);

// catalog
export const getCatalog = catalogRepo.findAll.bind(catalogRepo);
export const getBasicRecipe = catalogRepo.findById.bind(catalogRepo);
export const seedGallery = catalogRepo.getAvailableRecipes.bind(catalogRepo);
export const getAlmostThereRecipes = catalogRepo.getAlmostThereRecipes.bind(catalogRepo);
export const getBasicRecipes = catalogRepo.getRecipesByCategory.bind(catalogRepo);
export const getRecipeCategories = catalogRepo.getCategories.bind(catalogRepo);
export const getSpirits = catalogRepo.getSpirits.bind(catalogRepo);
export const getSpirit = catalogRepo.getSpiritById.bind(catalogRepo);
export const getPreparationMethods = catalogRepo.getPreparationMethods.bind(catalogRepo);
export const updateCatalog = catalogRepo.save.bind(catalogRepo);
export const deleteCatalogItem = catalogRepo.delete.bind(catalogRepo);
export const getHighestImpactIngredients =
	catalogRepo.getHighestImpactIngredients.bind(catalogRepo);
export const getRecipeCount = catalogRepo.getRecipeCount.bind(catalogRepo);

export { catalogRepo, inventoryRepo };
