// generator types

// shared image result
export type ImageResult = {
	url: string;
	mimeType: string;
	base64: string;
};

// input types
export type InventoryDescriptionInput = { name: string };
export type InventoryImageInput = { subject: string; description?: string; customPrompt?: string };
export type CatalogDescriptionInput = { name: string };
export type CatalogImageInput = {
	subject: string;
	ingredients?: string[];
	technique?: string;
	customPrompt?: string;
};
export type RecipeInsightsInput = { cocktailName: string };
export type RecipeRatingsInput = {
	recipeName: string;
	recipeDescription?: string;
	ingredients: Array<{ name: string; quantity: number; unit: string; proof?: number }>;
};
export type ProductRatingsInput = {
	productName: string;
	categoryName: string;
	proof?: number;
	description?: string;
};
export type CategoryDescriptionInput = { name: string };

// output types
export type InventoryDescriptionOutput = {
	description: string;
};

export type CatalogDescriptionOutput = {
	history: string;
	flavorProfile: string[];
	goodWith: string[];
	avoidWith: string[];
};

export type RecipeInsightsOutput = {
	history: string;
	flavorProfile: string;
	whyItWorks: string;
	proTips: string[];
	substitutions: Array<{
		ingredient: string;
		substitute: string;
		note: string;
	}>;
	glassware: string;
	garnish: string[];
	foodPairings: string[];
	occasion: string;
	variations: Array<{
		name: string;
		description: string;
	}>;
	similarCocktails: string[];
};

// real catalog data resolved for the AI insights section — grounds the AI's text
// suggestions in actual recipes/products so they become links instead of dead text.
// computed per-request (not cached with the AI output).
export type RecipeInsightLinks = {
	// ai similar-cocktail names matched against the accessible catalog
	similar: { name: string; recipeId: number | null; imageUrl: string | null }[];
	// ai variation riffs, with a recipe link when one exists in the catalog
	variations: { name: string; description: string; recipeId: number | null }[];
	// real recipes in the same category (base spirit), always linkable
	related: { recipeId: number; recipeName: string; imageUrl: string | null }[];
	// real substitutes per ingredient, derived from the category/parent-category graph
	substitutions: {
		ingredient: string;
		category: string;
		options: { productId: number; productName: string; inStock: boolean }[];
	}[];
};

export type RecipeRatingsOutput = {
	sweetnessRating: number;
	drynessRating: number;
	versatilityRating: number;
	strengthRating: number;
};

export type ProductRatingsOutput = {
	sweetnessRating: number;
	drynessRating: number;
	versatilityRating: number;
	strengthRating: number;
};

export type CategoryDescriptionOutput = {
	description: string;
};

export type CatalogVisualDescription = {
	visualDescription: string;
};

export type BottleScanInput = {
	image: string;
	categories: string[];
};

export type BottleScanOutput = {
	productName: string;
	category: string;
	proof: number;
	sizeInMilliliters: number;
	description: string;
};

// generator type mapping
export type GeneratorMap = {
	'inventory-description': { input: InventoryDescriptionInput; output: InventoryDescriptionOutput };
	'inventory-image': { input: InventoryImageInput; output: ImageResult };
	'catalog-description': { input: CatalogDescriptionInput; output: CatalogDescriptionOutput };
	'catalog-image': { input: CatalogImageInput; output: ImageResult };
	'recipe-insights': { input: RecipeInsightsInput; output: RecipeInsightsOutput };
	'recipe-ratings': { input: RecipeRatingsInput; output: RecipeRatingsOutput };
	'product-ratings': { input: ProductRatingsInput; output: ProductRatingsOutput };
	'category-description': { input: CategoryDescriptionInput; output: CategoryDescriptionOutput };
	'bottle-scan': { input: BottleScanInput; output: BottleScanOutput };
};

export type GeneratorType = keyof GeneratorMap;
