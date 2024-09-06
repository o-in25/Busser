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
    lastActivityDate?: Date | string
};

export type Product = {
  productId?: number,
  categoryId: number,
  supplierId?: number,
  productName: string,
  productInStockQuantity: number,
  productPricePerUnit: number,
  productUnitSizeInMilliliters: number,
  productProof: number,
  productDetailId?: number,
  productImageUrl?: string,
  categoryName?: string,
  categoryDescription?: string,
  productDescription?: string
  productSweetnessRating?: number
  productDrynessRating?: number
  productVersatilityRating?: number
  productStrengthRating?: number
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

export enum LogLevel {
  DEBUG = 1,
  INFO = 2,
  WARNING = 3,
  ERROR = 4,
  CRITICAL = 5
}

export type Log = {
  logLevelId: LogLevel
  logMessage: string,
  logDate: Date | string,
  logStackTrace: string | null
}

export type ComponentAction = 'add' | 'edit';

export type ProductDetail = {
  productDetailId?: number,
  productId: number,
  productImageUrl: string,
  productImageUrlUploadId?: string
}

export type FormSubmitResult = {
  success?: Record<'message', string>;
  error?: Record<'message', string>
  args?: any
}

export type Notification = {
  success?: Record<'message', string> | null;
  error?: Record<'message', string> | null;
};

export type Spirit = {
  recipeCategoryId: number,
  recipeCategoryDescription: string,
  recipeCategoryDescriptionText: string,
  recipeCategoryDescriptionImageUrl: string

}