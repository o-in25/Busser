// core.ts - backwards compatibility layer
// new code should import from repositories directly

import { DbProvider } from './db';
import { InventoryRepository } from './repositories/inventory.repository';
import { CatalogRepository } from './repositories/catalog.repository';

// re-export utilities from base
export {
  marshal,
  marshalToType,
  pascalCase,
  camelCase,
  titleCase,
} from './repositories/base.repository';

// singleton instances
const db = new DbProvider('app_d');
const inventoryRepo = new InventoryRepository(db);
const catalogRepo = new CatalogRepository(db);

// export repositories for direct access
export { inventoryRepo, catalogRepo };

// inventory functions (delegate to repository)
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
export const getCategory = inventoryRepo.findCategoryById.bind(inventoryRepo);
export const addCategory = inventoryRepo.createCategory.bind(inventoryRepo);
export const updateCategory = inventoryRepo.updateCategory.bind(inventoryRepo);

// catalog functions (delegate to repository)
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
