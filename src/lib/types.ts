import type { CookieSerializeOptions } from 'cookie';
export type Result<T> = {
    data?: T,
    error?: Error;
};

export type Session = {
    userId?: string,
    opts: CookieSerializeOptions & { path: string; };
};

export type User = {
    userId?: string,
    username?: string,
    email?: string;
    lastActivityDate?: Date
};

export type Product = {
  productId: 1,
  categoryId: 2,
  supplierId: 3,
  productName: "Example Product",
  productInStockQuantity: 100,
  productPricePerUnit: 10.5,
  productUnitSizeInMilliliters: 500,
  productProof: 40,
  productDetailId: 4,
  productImageUrl: "http://example.com/image.jpg",
  categoryName: "Beverages",
  categoryDescription: "A variety of beverages.";
};

export type GallerySeeding = {
  src: string,
  alt?: string
}