import type { CookieSerializeOptions } from 'cookie';

export type QueryResult<T = void> = {
  status: "success";
  data?: T;
} | {
  status: "error";
  error: string;
};

export type Result<T> = {
  data?: T,
  error?: Error;
};


export type Product = {
  productId: number | null, // can be null on insert
  categoryId: number,
  supplierId: number,
  productName: string,
  productInStockQuantity: number,
  productPricePerUnit: number,
  productUnitSizeInMilliliters: number,
  productProof: number,
  productDetailId: number | null,
  productImageUrl: string,
  categoryName: string,
  categoryDescription: string,
  productDescription: string;
  productSweetnessRating: number;
  productDrynessRating: number;
  productVersatilityRating: number;
  productStrengthRating: number;
};

export type Category = {
  categoryId: number,
  categoryName: string,
  categoryDescription: string;
};
export type GallerySeeding = {
  src: string,
  alt?: string;
};

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
  pages?: Page[];
};

export type Page = {
  name: string,
  href: string,
  active: boolean;
};

export type SelectOption = {
  name: string,
  value: string | number;
};

export enum LogLevel {
  DEBUG = 1,
  INFO = 2,
  WARNING = 3,
  ERROR = 4,
  CRITICAL = 5
}

export type Log = {
  logLevelId: LogLevel;
  logMessage: string,
  logDate: Date | string,
  logStackTrace: string | null;
};

export type ComponentAction = 'add' | 'edit';

export type ProductDetail = {
  productDetailId?: number,
  productId: number,
  productImageUrl: string,
  productImageUrlUploadId?: string;
};

export type FormSubmitResult = {
  success?: Record<'message', string>;
  error?: Record<'message', string>;
  args?: any;
};

export type Notification = {
  success?: Record<'message', string> | null;
  error?: Record<'message', string> | null;
};

export type Spirit = {
  recipeCategoryId: number,
  recipeCategoryDescription: string,
  recipeCategoryDescriptionText: string,
  recipeCategoryDescriptionImageUrl: string;

};

export type BasicRecipe = {
  recipeId: number,
  recipeName: string,
  recipeImageUrl: string | null,
  recipeDescription: string | null,
  recipeDescriptionImageUrl: string | null,
  recipeTechniqueDilutionPercentage: number,
  recipeTechniqueDescriptionText: string,
  recipeCategoryDescription: string;
};

export type PreparationMethod = {
  recipeTechniqueDescriptionId: number,
  recipeTechniqueDescriptionText: string,
  recipeTechniqueDilutionPercentage: number;
};

export type RecipeStep = {
  recipeStepId?: string,
  recipeId?: number,
  productId: number,
  productIdQuantityInMilliliters: number,
  recipeStepDescription: string;
};

export namespace Table {
  export type Recipe = {
    recipeId?: number,
    recipeCategoryId: number,
    recipeDescriptionId: number,
    recipeName: string,
    recipeImageUrl: string | null;
  };

  export type RecipeDescription = {
    recipeDescriptionId?: number,
    recipeDescription: string | null,
    recipeDescriptionImageUrl: string | null;
    recipeSweetnessRating: number,
    recipeDrynessRating: number;
    recipeStrengthRating: number;
    recipeVersatilityRating: number;
  };

  export type RecipeStep = {
    recipeStepId?: number,
    recipeId: number,
    productId: number,
    productIdQuantityInMilliliters: number,
    recipeStepDescription: string | null,
    productIdQuantityUnit: string;
  };

  export type RecipeTechnique = {
    recipeTechniqueId?: number,
    recipeTechniqueDescriptionId: number,
    recipeId: number,
    recipeTechniqueDilutionPercentage: number | null;
  };

  export type RecipeTechniqueDescription = {
    recipeTechniqueDescriptionId?: number,
    recipeTechniqueDescriptionText: string,
    recipeTechniqueDilutionPercentage: number;
  };

  export type Category = {
    categoryId?: number,
    categoryName: string,
    categoryDescription: string;
  };

  // export type RecipeStep = {
  //   recipeStepId,
  //   recipeId, 
  //   productId, 
  //   productIdQuantityInMilliliters, 
  //   recipeStepDescription
  // }

}

export namespace View {
  export type BasicRecipe = {
    recipeCategoryId?: number,
    recipeTechniqueDescriptionId?: number,

    recipeId: number,
    recipeName: string,
    recipeCategoryDescription: string,
    recipeDescription: string,
    recipeCategoryDescriptionText: string | null,
    recipeTechniqueDescriptionText: string | null,
    recipeTechniqueDilutionPercentage: number,
    recipeDescriptionImageUrl: string | null,
    recipeImageUrl: string | null,
    recipeCategoryDescriptionImageUrl: string | null;

    recipeSweetnessRating: number,
    recipeDrynessRating: number;
    recipeStrengthRating: number;
    recipeVersatilityRating: number;
  };

  export type BasicRecipeStep = {
    recipeStepId?: number,
    recipeId?: number;
    productId: number,
    // recipeStepDescription: string | null;
    recipeStepDescription: string;
    productName: string;
    categoryName: string;
    categoryDescription: string | null;
    supplierName: string;
    supplierDetails: string | null;
    productIdQuantityInMilliliters: number;
    productInStockQuantity: number;
    productPricePerUnit: number;
    productUnitSizeInMilliliters: number;
    productIdQuantityUnit: string;
    productProof: number;

    // TODO: do we need this?
    key?: string | number | null;
  };

  export type BasicRecipeCategory = {
    recipeCategoryId: number,
    recipeCategoryDescriptionText: string | null,
    recipeCategoryDescription: string | null,
    recipeCategoryDescriptionImageUrl: string | null;
  };
}


// TODO: change this to use the view
// we have way too many overlapping types
export namespace QueryRequest {
  export type Recipe = {
    recipeId?: number,
    recipeName: string,
    recipeCategoryId: number,
    recipeDescription: string;
    recipeTechniqueDescriptionId: number;
    recipeSweetnessRating: number,
    recipeDrynessRating: number;
    recipeStrengthRating: number;
    recipeVersatilityRating: number;
  };

  export type RecipeSteps = {
    recipeStepId?: number,
    productId: number,
    productIdQuantityInMilliliters: number,
    productIdQuantityUnit: string;
    recipeStepDescription: string;
  };

}

