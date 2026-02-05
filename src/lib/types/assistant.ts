// ai assistant types and tool definitions for recipe creation via chat

import type { ChatCompletionTool } from 'openai/resources/chat/completions';

import type { MatchMode } from './catalog';

export interface ProposedIngredient {
	productId: number | null;
	productName: string;
	categoryId: number;
	categoryName: string;
	matchMode: MatchMode;
	quantityMl: number;
	unit: string;
	description: string;
}

export interface ProposedNewIngredient {
	categoryName: string;
	categoryId: number | null;
	parentCategoryId: number | null;
	productName: string;
	quantityMl: number;
	unit: string;
	description: string;
}

export interface RecipeProposal {
	recipeName: string;
	recipeDescription: string;
	recipeCategoryId: number;
	recipeCategoryName: string;
	preparationMethodId: number;
	preparationMethodName: string;
	ratings: {
		sweetness: number;
		dryness: number;
		strength: number;
		versatility: number;
	};
	ingredients: ProposedIngredient[];
	missingIngredients: ProposedNewIngredient[];
}

// openai tool definitions for the ai recipe assistant
export const assistantTools: ChatCompletionTool[] = [
	{
		type: 'function',
		function: {
			name: 'search_inventory',
			description:
				'Search the workspace inventory for products. Can search by name, by category ID, or both. Returns matching products with their IDs, categories, stock status, and proof. Use this to find ingredients for a recipe. Stock level does not matter — all products in inventory are valid to use.',
			parameters: {
				type: 'object',
				properties: {
					query: {
						type: 'string',
						description:
							'Product name or partial name to search for (e.g. "rum", "lime", "angostura")',
					},
					categoryId: {
						type: 'number',
						description:
							'Category ID to filter by. Use this to find products within a specific category (e.g. after finding a category via search_categories).',
					},
				},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'list_categories',
			description:
				'List all ingredient categories in the workspace (e.g. Vodka, Gin, Bitters, Citrus). Returns category IDs, names, and parent/base spirit relationships.',
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'search_categories',
			description:
				'Search for a specific ingredient category by name. Use this to find the right categoryId when you know the type of ingredient but not the exact category name.',
			parameters: {
				type: 'object',
				properties: {
					query: {
						type: 'string',
						description:
							'Category name to search for (e.g. "bourbon", "triple sec", "simple syrup")',
					},
				},
				required: ['query'],
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'get_recipe_categories',
			description:
				'Get all recipe categories (spirit types like Whiskey, Gin, Rum, Tequila, etc.). These categorize the recipe by its primary spirit. Returns recipeCategoryId and description.',
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'get_preparation_methods',
			description:
				'Get all preparation methods (techniques like Stirred, Shaken, Built, Blended). Returns recipeTechniqueDescriptionId and description text.',
			parameters: {
				type: 'object',
				properties: {},
			},
		},
	},
	{
		type: 'function',
		function: {
			name: 'propose_recipe',
			description:
				'Propose a recipe for user confirmation. Call this ONLY after you have searched inventory and categories to populate the correct IDs. The user will review and can confirm or modify.',
			parameters: {
				type: 'object',
				properties: {
					recipeName: { type: 'string', description: 'Name of the cocktail' },
					recipeDescription: {
						type: 'string',
						description: 'Brief description of the cocktail, its flavor profile and history',
					},
					recipeCategoryId: {
						type: 'number',
						description: 'Recipe category ID (from get_recipe_categories)',
					},
					recipeCategoryName: {
						type: 'string',
						description: 'Recipe category name for display',
					},
					preparationMethodId: {
						type: 'number',
						description: 'Preparation method ID (from get_preparation_methods)',
					},
					preparationMethodName: {
						type: 'string',
						description: 'Preparation method name for display',
					},
					ratings: {
						type: 'object',
						properties: {
							sweetness: { type: 'number', description: '1-10 sweetness rating' },
							dryness: { type: 'number', description: '1-10 dryness rating' },
							strength: { type: 'number', description: '1-10 strength rating' },
							versatility: { type: 'number', description: '1-10 versatility rating' },
						},
						required: ['sweetness', 'dryness', 'strength', 'versatility'],
					},
					ingredients: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								productId: {
									type: 'number',
									description:
										'Product ID from search_inventory results. Must be a valid ID — if no product was found, put the ingredient in missingIngredients instead.',
								},
								productName: {
									type: 'string',
									description: 'Product or ingredient name',
								},
								categoryId: {
									type: 'number',
									description: 'Category ID for this ingredient',
								},
								categoryName: {
									type: 'string',
									description: 'Category name for display',
								},
								matchMode: {
									type: 'string',
									enum: ['EXACT_PRODUCT', 'ANY_IN_CATEGORY', 'ANY_IN_PARENT_CATEGORY'],
									description:
										'EXACT_PRODUCT if specific product required, ANY_IN_CATEGORY if any product in the category works, ANY_IN_PARENT_CATEGORY for any product whose category shares the same parent category',
								},
								quantityMl: {
									type: 'number',
									description: 'Quantity in milliliters',
								},
								unit: {
									type: 'string',
									description: 'Display unit (oz, ml, dash, barspoon, etc.)',
								},
								description: {
									type: 'string',
									description: 'Step description (e.g. "2 oz bourbon")',
								},
							},
							required: [
								'productId',
								'productName',
								'categoryId',
								'categoryName',
								'matchMode',
								'quantityMl',
								'unit',
								'description',
							],
						},
						description:
							'Ingredients where a matching product was found in inventory via search_inventory. Each item MUST have a valid productId. Do NOT include ingredients here if no product was found.',
					},
					missingIngredients: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								categoryName: {
									type: 'string',
									description: 'Category name for the new ingredient',
								},
								categoryId: {
									type: ['number', 'null'],
									description: 'Existing category ID if one matches, null to create new',
								},
								parentCategoryId: {
									type: ['number', 'null'],
									description: 'Parent category ID if creating under an existing category',
								},
								productName: {
									type: 'string',
									description: 'Name for the new product',
								},
								quantityMl: {
									type: 'number',
									description: 'Quantity in milliliters',
								},
								unit: {
									type: 'string',
									description: 'Display unit',
								},
								description: {
									type: 'string',
									description: 'Step description',
								},
							},
							required: [
								'categoryName',
								'categoryId',
								'parentCategoryId',
								'productName',
								'quantityMl',
								'unit',
								'description',
							],
						},
						description:
							'Ingredients where NO matching product was found in inventory via search_inventory. These will be created as new products. An ingredient must be in EITHER ingredients OR missingIngredients, never both.',
					},
				},
				required: [
					'recipeName',
					'recipeDescription',
					'recipeCategoryId',
					'recipeCategoryName',
					'preparationMethodId',
					'preparationMethodName',
					'ratings',
					'ingredients',
					'missingIngredients',
				],
			},
		},
	},
];
