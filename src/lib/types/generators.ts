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

export type RecipeRatingsOutput = {
	sweetnessRating: number;
	drynessRating: number;
	versatilityRating: number;
	strengthRating: number;
};

export type CategoryDescriptionOutput = {
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
	'category-description': { input: CategoryDescriptionInput; output: CategoryDescriptionOutput };
};

export type GeneratorType = keyof GeneratorMap;
