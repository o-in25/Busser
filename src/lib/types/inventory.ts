// inventory domain types
// tables: product, productdetail, category, supplier
// views: inventory

// category table (product categories like vodka, gin, bourbon)
export type Category = {
  categoryId: number;
  categoryName: string;
  categoryDescription: string | null;
};

// supplier table
export type Supplier = {
  supplierId: number;
  supplierName: string | null;
  supplierDetails: string | null;
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

// inventory view (product + productdetail + category joined)
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

// stats and filters for inventory ui
export type InventoryStats = {
  total: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
  categoryBreakdown: CategoryCount[];
};

export type CategoryCount = {
  categoryId: number;
  categoryName: string;
  count: number;
};

export type InventoryFilters = {
  search: string;
  categoryId: string;
  stockFilter: string;
  page: number;
};
