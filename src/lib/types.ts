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
  productId: number,
  categoryId: number,
  supplierId: number,
  productName: string,
  productInStockQuantity: number,
  productPricePerUnit: number,
  productUnitSizeInMilliliters: number,
  productProof: number,
  productDetailId: number,
  productImageUrl: string,
  categoryName: string,
  categoryDescription: string;
};

export type GallerySeeding = {
  src: string,
  alt?: string
}

