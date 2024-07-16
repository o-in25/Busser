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

export type Category = {
  categoryId: number,
  categoryName: string,
  categoryDescription: string
}
export type GallerySeeding = {
  src: string,
  alt?: string
}

export type PaginationResult<T> = {
  data: T,
  pagination: PaginationData;
};

export type PaginationData = {
  total: number,
  lastPage: number, 
  prevPage: number,
  nextPage: number,
  currentPage: number,
  perPage: number,
  from: number,
  to: number,
  pages?: Page[]
}

export type Page = {
  name: string,
  href: string,
  active: boolean
}

export type SelectOption = {
  name: string,
  value: string | number
}