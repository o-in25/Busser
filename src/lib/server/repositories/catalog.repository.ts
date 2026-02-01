// catalog domain repository
import type {
	BasicRecipe,
	PaginationResult,
	PreparationMethod,
	QueryRequest,
	QueryResult,
	Spirit,
	Table,
	View,
} from '$lib/types';

import { DbProvider } from '../db';
import { Logger } from '../logger';
import { deleteSignedUrl, getSignedUrl } from '../storage';
import {
	BaseRepository,
	camelCase,
	emptyPagination,
	marshal,
	marshalToType,
} from './base.repository';

export class CatalogRepository extends BaseRepository {
	constructor(db: DbProvider) {
		super(db);
	}

	async findAll(
		workspaceId: string,
		currentPage: number,
		perPage: number = 25,
		filter: (Partial<View.BasicRecipe> & Partial<View.BasicRecipeStep>) | null = null
	): Promise<PaginationResult<View.BasicRecipe[]>> {
		try {
			let query = this.db.table('basicrecipe as r').select().where('r.workspaceId', workspaceId);

			if (filter?.productInStockQuantity) {
				query = query.whereIn(
					'r.RecipeId',
					this.db
						.table('basicrecipestep as rs')
						.select('rs.RecipeId')
						.where('rs.workspaceId', workspaceId)
						.groupBy('rs.RecipeId')
						.having(
							this.db.query.raw(
								'COUNT(rs.RecipeStepId) = COUNT(CASE WHEN rs.ProductInStockQuantity = ? THEN 1 END)',
								[filter.productInStockQuantity]
							)
						)
				);
			}

			if (filter?.recipeName) {
				query = query.where('recipeName', 'like', `%${filter.recipeName}%`);
			}

			if (filter?.recipeCategoryId) {
				query = query.where('recipeCategoryId', filter.recipeCategoryId);
			}

			query = query.orderBy('recipeName');
			const { data, pagination } = await query.paginate({
				perPage,
				currentPage,
				isLengthAware: true,
			});
			const result: View.BasicRecipe[] = marshalToType<View.BasicRecipe[]>(data);

			return { data: result, pagination };
		} catch (error: any) {
			console.error(error);
			return { data: [], pagination: emptyPagination };
		}
	}

	async findById(
		workspaceId: string,
		recipeId: string
	): Promise<QueryResult<{ recipe: View.BasicRecipe; recipeSteps: View.BasicRecipeStep[] }>> {
		try {
			let recipe: View.BasicRecipe | undefined;
			let recipeSteps: View.BasicRecipeStep[] | undefined;

			await this.db.query.transaction(async (trx) => {
				let [dbResult] = await trx('basicrecipe').select().where({ recipeId, workspaceId });
				recipe = marshal<View.BasicRecipe>(dbResult, camelCase);
				if (!recipe) throw Error('Recipe not found in this workspace.');
				dbResult = await trx('basicrecipestep').select().where({ recipeId, workspaceId });
				recipeSteps = marshal<View.BasicRecipeStep[]>(dbResult, camelCase);
			});

			if (!recipe || !recipeSteps) {
				throw Error('Could not get recipe details.');
			}

			return { status: 'success', data: { recipe, recipeSteps } };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: error?.code || 'An unknown error occurred.' };
		}
	}

	async getAvailableRecipes(workspaceId: string): Promise<QueryResult<View.BasicRecipe[]>> {
		try {
			let dbResult = await this.db
				.table('basicrecipe')
				.where('WorkspaceId', workspaceId)
				.whereIn('RecipeId', function () {
					this.select('RecipeId')
						.from('availablerecipes')
						.where('WorkspaceId', workspaceId)
						.groupBy('RecipeId');
				});
			const data: View.BasicRecipe[] = marshalToType<View.BasicRecipe[]>(dbResult);
			return { status: 'success', data };
		} catch (error: any) {
			console.error(error);
			return { status: 'error', error: 'Unable to get recipes.' };
		}
	}

	async getAlmostThereRecipes(
		workspaceId: string
	): Promise<Array<View.BasicRecipe & { missingIngredient: string | null }>> {
		try {
			const result = await this.db
				.table('basicrecipe as r')
				.select('r.*')
				.where('r.workspaceId', workspaceId)
				.whereIn('r.RecipeId', function () {
					this.select('rs.RecipeId')
						.from('basicrecipestep as rs')
						// .where('rs.workspaceId', workspaceId)
						.groupBy('rs.RecipeId')
						.havingRaw('SUM(CASE WHEN rs.ProductInStockQuantity = 0 THEN 1 ELSE 0 END) = 1')
						.havingRaw('COUNT(rs.RecipeStepId) > 1');
				})
				.limit(6);
			const recipes: View.BasicRecipe[] = marshalToType<View.BasicRecipe[]>(result);

			const recipesWithMissing = await Promise.all(
				recipes.map(async (recipe) => {
					const missing = await this.db
						.table('basicrecipestep')
						.select('ProductName')
						.where('RecipeId', recipe.recipeId)
						.where('WorkspaceId', workspaceId)
						.where('ProductInStockQuantity', 0)
						.first();
					return { ...recipe, missingIngredient: missing?.ProductName || null };
				})
			);

			return recipesWithMissing;
		} catch (e) {
			console.error('Failed to get almost-there recipes:', e);
			return [];
		}
	}

	async getRecipesByCategory(
		workspaceId: string,
		recipeCategoryId: number | string | null = null
	): Promise<QueryResult<BasicRecipe[]>> {
		try {
			let query = this.db.table<BasicRecipe>('basicrecipe').where('workspaceId', workspaceId);
			if (recipeCategoryId) {
				query.where('recipeCategoryId', recipeCategoryId);
			}
			const dbResult = await query;
			const data = marshal<BasicRecipe[]>(dbResult);
			return { status: 'success', data };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not get basic recipes for specified query.' };
		}
	}

	async getCategories(): Promise<QueryResult<View.BasicRecipeCategory[]>> {
		try {
			let dbResult = await this.db.table<View.BasicRecipeCategory>('basicrecipecategory').select();
			const data: View.BasicRecipeCategory[] = marshalToType<View.BasicRecipeCategory[]>(dbResult);
			return { status: 'success', data };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: error.sqlMessage || error.message };
		}
	}

	async getSpirits(): Promise<Spirit[]> {
		try {
			const dbResult = await this.db
				.table<Spirit>('spirits')
				.select()
				.orderBy('recipeCategoryDescription');
			return marshal<Spirit[]>(dbResult);
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async getSpiritById(id: number | string): Promise<Spirit | null> {
		try {
			const dbResult = await this.db.table<Spirit>('spirits').where('RecipeCategoryId', id);
			const [result] = marshal<Spirit[]>(dbResult);
			if (!result) throw Error('Spirit not found.');
			return result;
		} catch (error) {
			console.error(error);
			return null;
		}
	}

	async getPreparationMethods(): Promise<QueryResult<PreparationMethod[]>> {
		try {
			const dbResult = await this.db.table<PreparationMethod>('preparationmethod');
			const data = marshal<PreparationMethod[]>(dbResult);
			return { status: 'success', data };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not get preparation methods.' };
		}
	}

	async save(
		workspaceId: string,
		recipe: QueryRequest.Recipe,
		recipeSteps: QueryRequest.RecipeSteps[],
		file: File
	): Promise<QueryResult<{ recipe: View.BasicRecipe; recipeSteps: View.BasicRecipeStep[] }>> {
		const recipeImageUrl = await this.getImageUrl(file);

		try {
			let newRecipe: { recipe: View.BasicRecipe; recipeSteps: View.BasicRecipeStep[] } = {
				recipe: {} as View.BasicRecipe,
				recipeSteps: [],
			};

			await this.db.query.transaction(async (trx) => {
				let keys: { recipeDescriptionId: number | undefined; recipeId: number | undefined } = {
					recipeDescriptionId: undefined,
					recipeId: undefined,
				};

				let dbResult;

				let oldRecipe = await trx('recipe')
					.select('RecipeDescriptionId', 'RecipeCategoryId')
					.where('RecipeId', recipe.recipeId || -1)
					.where('workspaceId', workspaceId)
					.first();

				oldRecipe = marshal(oldRecipe, camelCase);

				// create new recipe
				if (!oldRecipe) {
					[dbResult] = await trx('recipedescription').insert({
						workspaceId,
						RecipeDescription: recipe.recipeDescription,
						RecipeDescriptionImageUrl: null,
						RecipeSweetnessRating: recipe.recipeSweetnessRating,
						RecipeDrynessRating: recipe.recipeDrynessRating,
						RecipeStrengthRating: recipe.recipeStrengthRating,
						RecipeVersatilityRating: recipe.recipeVersatilityRating,
					});

					if (!dbResult) throw new Error('Cannot create recipe description.');
					keys.recipeDescriptionId = dbResult;

					[dbResult] = await trx('recipe').insert({
						workspaceId,
						RecipeCategoryId: recipe.recipeCategoryId,
						RecipeDescriptionId: keys.recipeDescriptionId,
						RecipeName: recipe.recipeName,
						RecipeImageUrl: recipeImageUrl,
					});

					if (!dbResult) throw new Error('Cannot create recipe.');
					keys.recipeId = dbResult;
				} else {
					keys = {
						recipeDescriptionId: oldRecipe.recipeDescriptionId,
						recipeId: recipe.recipeId,
					};
				}

				// update existing recipe
				if (oldRecipe) {
					dbResult = await trx('recipedescription')
						.where('RecipeDescriptionId', keys.recipeDescriptionId)
						.update({
							RecipeDescription: recipe.recipeDescription,
							RecipeSweetnessRating: recipe.recipeSweetnessRating,
							RecipeDrynessRating: recipe.recipeDrynessRating,
							RecipeStrengthRating: recipe.recipeStrengthRating,
							RecipeVersatilityRating: recipe.recipeVersatilityRating,
						});

					if (!dbResult) throw new Error('Recipe description not found.');
				}

				// update technique
				dbResult = await trx('recipetechnique')
					.insert({
						RecipeTechniqueDescriptionId: recipe.recipeTechniqueDescriptionId,
						RecipeId: keys.recipeId,
					})
					.onConflict('RecipeId')
					.merge();

				// update recipe record
				if (oldRecipe) {
					let query: any = {
						WorkspaceId: workspaceId,
						RecipeId: recipe.recipeId,
						RecipeCategoryId: recipe.recipeCategoryId,
						RecipeDescriptionId: keys.recipeDescriptionId,
						RecipeName: recipe.recipeName,
					};

					if (recipeImageUrl !== null) {
						query = { ...query, recipeImageUrl };
					}

					dbResult = await trx('recipe').insert(query).onConflict('RecipeId').merge();

					// delete old steps
					dbResult = await trx('recipestep').where('RecipeId', keys.recipeId).del();
				}

				// insert new steps
				let steps: Table.RecipeStep[] = recipeSteps.map(
					({
						productId,
						productIdQuantityInMilliliters,
						productIdQuantityUnit,
						recipeStepDescription,
					}) => ({
						recipeId: keys.recipeId || 0,
						productId,
						productIdQuantityInMilliliters,
						productIdQuantityUnit,
						recipeStepDescription,
					})
				);

				dbResult = await trx('recipestep').insert(steps).onConflict('RecipeId').merge();

				// fetch updated data
				dbResult = await trx('basicrecipe')
					.select()
					.where({ recipeId: keys.recipeId, workspaceId })
					.first();
				newRecipe.recipe = marshalToType<View.BasicRecipe>(dbResult, camelCase);

				dbResult = await trx('basicrecipestep')
					.select()
					.where({ recipeId: keys.recipeId, workspaceId });
				newRecipe.recipeSteps = marshalToType<View.BasicRecipeStep[]>(dbResult, camelCase);
			});

			return { status: 'success', data: newRecipe };
		} catch (error: any) {
			console.error(error.message);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Cannot save changes.' };
		}
	}

	async delete(workspaceId: string, recipeId: number): Promise<QueryResult<number>> {
		try {
			const { deletedRows, recipeImageUrl } = await this.db.query.transaction(async (trx) => {
				const dbResult = await trx('recipe')
					.select('RecipeDescriptionId', 'RecipeImageUrl')
					.where('RecipeId', recipeId)
					.where('workspaceId', workspaceId);

				const [parentRow] = marshal<any[]>(dbResult, camelCase);
				if (!parentRow) throw new Error('Recipe not found in this workspace.');

				const { recipeDescriptionId, recipeImageUrl } = parentRow;

				const deletedRows = await trx('recipedescription')
					.where('RecipeDescriptionId', recipeDescriptionId)
					.where('workspaceId', workspaceId)
					.del();

				if (deletedRows < 1)
					throw new Error('Could not delete recipe because no rows were affected.');

				return { recipeImageUrl, deletedRows };
			});

			if (recipeImageUrl) {
				await deleteSignedUrl(recipeImageUrl);
			}

			return { status: 'success', data: deletedRows };
		} catch (error: any) {
			console.error(error.message);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Cannot save changes.' };
		}
	}

	private async getImageUrl(image: File | null): Promise<string | null> {
		if (!image || image.size === 0 || image.name === 'undefined') return null;
		const signedUrl = await getSignedUrl(image);
		return signedUrl.length ? signedUrl : null;
	}
}
