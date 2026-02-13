import type { Knex } from 'knex';
import recipes from './data/global-catalog-recipes.json';

const WORKSPACE = 'ws-global-catalog';
const SUPPLIER_ID = 1;

// parent categories for new ingredient categories
const PARENT_CATEGORY_MAP: Record<string, string> = {
	'Maraschino Liqueur': 'Liqueur',
	'Green Chartreuse': 'Herbal Liqueur',
	'Yellow Chartreuse': 'Herbal Liqueur',
	'Raspberry Syrup': 'Syrup',
	'Scotch Whisky': 'Whiskey',
	'Cachaça': 'Rum',
	'Pisco': 'Brandy',
	'Apple Brandy': 'Brandy',
	'Lillet Blanc': 'Fortified wine',
	'Amaretto': 'Liqueur',
	'Aperol': 'Liqueur',
	'Drambuie': 'Liqueur',
	'Crème de Violette': 'Liqueur',
	'Crème de Cacao': 'Liqueur',
};

interface RecipeData {
	name: string;
	spirit: string;
	technique: string;
	description: string;
	ratings: { sweetness: number; dryness: number; strength: number; versatility: number };
	steps: { category: string; qty: number; unit: string; desc: string }[];
}

async function resolveCategory(knex: Knex, categoryName: string): Promise<number> {
	const existing = await knex('category')
		.where({ CategoryName: categoryName, WorkspaceId: WORKSPACE })
		.first();
	if (existing) return existing.CategoryId;

	// resolve parent if one is mapped
	let parentId: number | null = null;
	const parentName = PARENT_CATEGORY_MAP[categoryName];
	if (parentName) {
		const parent = await knex('category')
			.where({ CategoryName: parentName, WorkspaceId: WORKSPACE })
			.first();
		if (parent) parentId = parent.CategoryId;
	}

	const [id] = await knex('category').insert({
		WorkspaceId: WORKSPACE,
		CategoryName: categoryName,
		ParentCategoryId: parentId,
	});
	return id;
}

async function resolveProduct(
	knex: Knex,
	categoryId: number,
	categoryName: string
): Promise<number> {
	const existing = await knex('product')
		.where({ CategoryId: categoryId, WorkspaceId: WORKSPACE })
		.first();
	if (existing) return existing.ProductId;

	const [id] = await knex('product').insert({
		WorkspaceId: WORKSPACE,
		CategoryId: categoryId,
		SupplierId: SUPPLIER_ID,
		ProductName: categoryName,
		ProductInStockQuantity: 1,
		ProductPricePerUnit: 0,
		ProductUnitSizeInMilliliters: 0,
		ProductProof: 0,
	});
	return id;
}

export async function seed(knex: Knex): Promise<void> {
	for (const recipe of recipes as RecipeData[]) {
		// skip if already seeded
		const exists = await knex('recipe')
			.where({ RecipeName: recipe.name, WorkspaceId: WORKSPACE })
			.first();
		if (exists) {
			console.log(`  skip: ${recipe.name} (already exists)`);
			continue;
		}

		// resolve spirit → recipecategory
		const spiritRow = await knex('recipecategory')
			.where('RecipeCategoryDescription', recipe.spirit)
			.first();
		if (!spiritRow) throw new Error(`unknown spirit: ${recipe.spirit}`);

		// resolve technique
		const techRow = await knex('recipetechniquedescription')
			.where('RecipeTechniqueDescriptionText', recipe.technique)
			.first();
		if (!techRow) throw new Error(`unknown technique: ${recipe.technique}`);

		// resolve categories and products for each step
		const resolvedSteps: {
			categoryId: number;
			productId: number;
			category: string;
			qty: number;
			unit: string;
			desc: string;
		}[] = [];
		for (const step of recipe.steps) {
			const categoryId = await resolveCategory(knex, step.category);
			const productId = await resolveProduct(knex, categoryId, step.category);
			resolvedSteps.push({ ...step, categoryId, productId });
		}

		// insert recipe chain in a transaction
		await knex.transaction(async (trx) => {
			const [descId] = await trx('recipedescription').insert({
				RecipeDescription: recipe.description,
				RecipeSweetnessRating: recipe.ratings.sweetness,
				RecipeDrynessRating: recipe.ratings.dryness,
				RecipeStrengthRating: recipe.ratings.strength,
				RecipeVersatilityRating: recipe.ratings.versatility,
			});

			const [recipeId] = await trx('recipe').insert({
				WorkspaceId: WORKSPACE,
				RecipeCategoryId: spiritRow.RecipeCategoryId,
				RecipeDescriptionId: descId,
				RecipeName: recipe.name,
			});

			await trx('recipetechnique').insert({
				RecipeTechniqueDescriptionId: techRow.RecipeTechniqueDescriptionId,
				RecipeId: recipeId,
			});

			for (const step of resolvedSteps) {
				await trx('recipestep').insert({
					RecipeId: recipeId,
					ProductId: step.productId,
					CategoryId: step.categoryId,
					MatchMode: 'ANY_IN_CATEGORY',
					ProductIdQuantityInMilliliters: step.qty,
					ProductIdQuantityUnit: step.unit,
					RecipeStepDescription: step.desc,
				});
			}
		});

		console.log(`  added: ${recipe.name}`);
	}
}
