// inventory domain types
// tables: product, productdetail, category, supplier
// views: inventory

// categorygroup table (broad display groupings like spirits, liqueurs)
export type CategoryGroup = {
	categoryGroupId: number;
	categoryGroupName: string;
	categoryGroupDescription: string | null;
};

// category table (product categories like vodka, gin, bourbon)
export type Category = {
	categoryId: number;
	categoryName: string;
	categoryDescription: string | null;
	parentCategoryId: number | null;
	categoryGroupId: number | null;
};

// supplier table
export type Supplier = {
	supplierId: number;
	supplierName: string | null;
	supplierDetails: string | null;
	supplierWebsiteUrl: string | null;
	supplierPhone: string | null;
	supplierAddress: string | null;
	supplierPlaceId: string | null;
	supplierType: string | null;
};

// shopping list item (out-of-stock product enriched with supplier + recipe data)
export type ShoppingListItem = {
	productId: number;
	productName: string;
	productImageUrl: string;
	productPricePerUnit: number;
	productUnitSizeInMilliliters: number;
	categoryName: string;
	categoryGroupName: string | null;
	supplierId: number;
	supplierName: string | null;
	recipeCount: number;
	unlockableRecipes: number;
	impactScore: number;
};

// shopping list summary stats
export type ShoppingListSummary = {
	totalItems: number;
	totalEstimatedCost: number;
	bySupplier: { supplierId: number; name: string; count: number; subtotal: number }[];
	byCategory: { name: string; count: number; subtotal: number }[];
	totalRecipesUnlockable: number;
};

// product table (raw)
export type ProductRecord = {
	productId: number;
	categoryId: number;
	supplierId: number;
	productName: string;
	productInStockQuantity: number;
	productPricePerUnit: number;
	productUnitSizeInMilliliters: number;
	productProof: number;
};

// productdetail table
export type ProductDetail = {
	productDetailId?: number;
	productId: number;
	productImageUrl: string | null;
	productDescription?: string | null;
	productImageUrlUploadId?: string;
	productSweetnessRating?: number;
	productDrynessRating?: number;
	productVersatilityRating?: number;
	productStrengthRating?: number;
};

// inventory view (product + productdetail + category + categorygroup joined)
// this is what most code expects when using "Product"
export type Product = {
	productId: number | null;
	categoryId: number;
	supplierId: number;
	productDetailId: number | null;
	productName: string;
	productDescription: string;
	categoryName: string;
	categoryDescription: string;
	parentCategoryId: number | null;
	parentCategoryName: string | null;
	categoryGroupId: number | null;
	categoryGroupName: string | null;
	productInStockQuantity: number;
	productPricePerUnit: number;
	productUnitSizeInMilliliters: number;
	productProof: number;
	productImageUrl: string;
	productSweetnessRating: number;
	productDrynessRating: number;
	productVersatilityRating: number;
	productStrengthRating: number;
};

// google places result (for nearby store search UI)
export type PlaceResult = {
	placeId: string;
	name: string;
	address: string;
	phone?: string;
	website?: string;
	types: string[];
	rating?: number;
	openNow?: boolean;
};

// stats and filters for inventory ui
export type InventoryStats = {
	total: number;
	inStock: number;
	outOfStock: number;
	categoryBreakdown: CategoryGroupCount[];
};

export type CategoryGroupCount = {
	categoryGroupId: number;
	categoryGroupName: string;
	count: number;
};

export type InventoryFilters = {
	search: string;
	categoryGroupId: string;
	stockFilter: string;
	page: number;
};
