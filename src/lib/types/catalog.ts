// catalog domain types
// tables: recipe, recipecategory, recipecategorydescription, recipedescription,
//         recipestep, recipetechnique, recipetechniquedescription
// views: basicrecipe, basicrecipestep, basicrecipecategory, spirits, preparationmethod

export type AdvancedFilter = {
	readyToMake?: boolean;
	ingredientProductId?: number;
	strengthMin?: number;
	strengthMax?: number;
	ingredientCountMin?: number;
	ingredientCountMax?: number;
	preparationMethodId?: number;
	ratingMin?: number;
	ratingMax?: number;
};

// Match mode for recipe ingredients
// - EXACT_PRODUCT: Only the specific product satisfies the recipe step
// - ANY_IN_CATEGORY: Any product in the same category satisfies the step
// - ANY_IN_PARENT_CATEGORY: Any product whose category shares the same parent satisfies the step
export type MatchMode = 'EXACT_PRODUCT' | 'ANY_IN_CATEGORY' | 'ANY_IN_PARENT_CATEGORY';

// workspacefeatured table - curated featured cocktails per workspace
export interface WorkspaceFeatured {
	featuredId: number;
	workspaceId: string;
	recipeId: number;
	featuredOrder: number;
	createdDate: Date;
}

// recipecategory table (whiskey cocktails, tiki, etc.)
export type RecipeCategory = {
	recipeCategoryId: number;
	recipeCategoryDescription: string | null;
};

// recipecategorydescription table
export type RecipeCategoryDescription = {
	recipeCategoryDescriptionId: number;
	recipeCategoryId: number;
	recipeCategoryDescriptionText: string | null;
	recipeCategoryDescriptionImageUrl: string | null;
};

// recipedescription table
export type RecipeDescription = {
	recipeDescriptionId: number;
	recipeDescription: string | null;
	recipeDescriptionImageUrl: string | null;
	recipeSweetnessRating: number;
	recipeDrynessRating: number;
	recipeVersatilityRating: number;
	recipeStrengthRating: number;
};

// recipe table
export type Recipe = {
	recipeId: number;
	recipeCategoryId: number;
	recipeDescriptionId: number;
	recipeName: string | null;
	recipeImageUrl: string | null;
};

// recipestep table
export type RecipeStep = {
	recipeStepId: number;
	recipeId: number;
	productId: number;
	categoryId: number | null;
	matchMode: MatchMode;
	productIdQuantityInMilliliters: number;
	recipeStepDescription: string | null;
	productIdQuantityUnit: string;
};

// recipetechniquedescription table (preparation methods: stirred, shaken, etc.)
export type PreparationMethod = {
	recipeTechniqueDescriptionId: number;
	recipeTechniqueDescriptionText: string;
	recipeTechniqueDilutionPercentage: number;
	recipeTechniqueDescriptionInstructions?: string;
	recipeTechniqueDescriptionImageUrl?: string;
};

// recipetechnique table (links recipe to preparation method)
export type RecipeTechnique = {
	recipeTechniqueId: number;
	recipeTechniqueDescriptionId: number;
	recipeId: number;
};

// spirits view (recipecategory + recipecategorydescription)
export type Spirit = {
	recipeCategoryId: number;
	recipeCategoryDescription: string | null;
	recipeCategoryDescriptionText: string | null;
	recipeCategoryDescriptionImageUrl: string | null;
};

// basicrecipe view
export type BasicRecipe = {
	recipeId: number;
	recipeName: string | null;
	recipeCategoryId: number;
	recipeCategoryDescription: string | null;
	recipeDescription: string | null;
	recipeCategoryDescriptionText: string | null;
	recipeTechniqueDescriptionText: string | null;
	recipeTechniqueDilutionPercentage: number;
	recipeDescriptionImageUrl: string | null;
	recipeImageUrl: string | null;
	recipeCategoryDescriptionImageUrl: string | null;
	recipeTechniqueDescriptionId: number;
	recipeSweetnessRating: number;
	recipeDrynessRating: number;
	recipeStrengthRating: number;
	recipeVersatilityRating: number;
};

// basicrecipestep view
export type BasicRecipeStep = {
	recipeId: number;
	recipeStepId: number;
	recipeStepDescription: string | null;
	matchMode: MatchMode;
	stepCategoryId: number | null;
	productName: string;
	productId: number;
	categoryId: number;
	categoryName: string;
	categoryDescription: string | null;
	parentCategoryId: number | null;
	parentCategoryName: string | null;
	supplierName: string | null;
	supplierDetails: string | null;
	productIdQuantityInMilliliters: number;
	productIdQuantityUnit: string;
	productInStockQuantity: number;
	effectiveInStock: number; // 1 if available considering MatchMode, 0 otherwise
	productPricePerUnit: number;
	productUnitSizeInMilliliters: number;
	productProof: number;
};

// basicrecipecategory view
export type BasicRecipeCategory = {
	recipeCategoryId: number;
	recipeCategoryDescriptionText: string | null;
	recipeCategoryDescriptionImageUrl: string | null;
	recipeCategoryDescription: string | null;
};

// backwards compat: namespaces for table/view/request shapes
// TODO: migrate usages to top-level types and remove these
export namespace Table {
	export type Recipe = {
		recipeId?: number;
		recipeCategoryId: number;
		recipeDescriptionId: number;
		recipeName: string;
		recipeImageUrl: string | null;
	};

	export type RecipeDescription = {
		recipeDescriptionId?: number;
		recipeDescription: string | null;
		recipeDescriptionImageUrl: string | null;
		recipeSweetnessRating: number;
		recipeDrynessRating: number;
		recipeStrengthRating: number;
		recipeVersatilityRating: number;
	};

	export type RecipeStep = {
		recipeStepId?: number;
		recipeId: number;
		productId: number;
		categoryId?: number | null;
		matchMode?: MatchMode;
		productIdQuantityInMilliliters: number;
		recipeStepDescription: string | null;
		productIdQuantityUnit: string;
	};

	export type RecipeTechnique = {
		recipeTechniqueId?: number;
		recipeTechniqueDescriptionId: number;
		recipeId: number;
		recipeTechniqueDilutionPercentage: number | null;
	};

	export type RecipeTechniqueDescription = {
		recipeTechniqueDescriptionId?: number;
		recipeTechniqueDescriptionText: string;
		recipeTechniqueDescriptionInstructions: string;
		recipeTechniqueDescriptionImageUrl: string;
		recipeTechniqueDilutionPercentage: number;
	};

	// deprecated: this is a PRODUCT category, not recipe category
	// use Category from inventory.ts instead
	export type Category = {
		categoryId?: number;
		categoryName: string;
		categoryDescription: string | null;
		parentCategoryId?: number | null;
		categoryGroupId?: number | null;
	};
}

export namespace View {
	export type BasicRecipe = {
		recipeCategoryId?: number;
		recipeTechniqueDescriptionId?: number;
		recipeId: number;
		recipeName: string;
		recipeCategoryDescription: string;
		recipeDescription: string;
		recipeCategoryDescriptionText: string | null;
		recipeTechniqueDescriptionText: string | null;
		recipeTechniqueDilutionPercentage: number;
		recipeDescriptionImageUrl: string | null;
		recipeImageUrl: string | null;
		recipeCategoryDescriptionImageUrl: string | null;
		recipeSweetnessRating: number;
		recipeDrynessRating: number;
		recipeStrengthRating: number;
		recipeVersatilityRating: number;
		workspaceId: string;
	};

	export type BasicRecipeStep = {
		recipeStepId?: number;
		recipeId?: number;
		productId: number;
		categoryId?: number;
		stepCategoryId?: number | null;
		matchMode?: MatchMode;
		parentCategoryId?: number | null;
		parentCategoryName?: string | null;
		recipeStepDescription: string;
		productName: string;
		categoryName: string;
		categoryDescription: string | null;
		supplierName: string;
		supplierDetails: string | null;
		productIdQuantityInMilliliters: number;
		productInStockQuantity: number;
		effectiveInStock?: number; // 1 if available considering MatchMode, 0 otherwise
		productPricePerUnit: number;
		productUnitSizeInMilliliters: number;
		productIdQuantityUnit: string;
		productProof: number;
		key?: string | number | null;
	};

	export type BasicRecipeCategory = {
		recipeCategoryId: number;
		recipeCategoryDescriptionText: string | null;
		recipeCategoryDescription: string | null;
		recipeCategoryDescriptionImageUrl: string | null;
	};
}

export namespace QueryRequest {
	export type Recipe = {
		recipeId?: number;
		recipeName: string;
		recipeCategoryId: number;
		recipeDescription: string;
		recipeTechniqueDescriptionId: number;
		recipeSweetnessRating: number;
		recipeDrynessRating: number;
		recipeStrengthRating: number;
		recipeVersatilityRating: number;
	};

	export type RecipeSteps = {
		recipeStepId?: number;
		productId: number;
		categoryId?: number | null;
		matchMode?: MatchMode;
		productIdQuantityInMilliliters: number;
		productIdQuantityUnit: string;
		recipeStepDescription: string;
	};
}
