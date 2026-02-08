// catalog domain repository
import type {
	AdvancedFilter,
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
import { deleteSignedUrl } from '../storage';
import { BaseRepository, emptyPagination } from './base.repository';

export class CatalogRepository extends BaseRepository {
	constructor(db: DbProvider) {
		super(db);
	}

	async findAll(
		workspaceId: string,
		currentPage: number,
		perPage: number = 25,
		filter: (Partial<View.BasicRecipe> & Partial<View.BasicRecipeStep>) | null = null,
		advancedFilter: AdvancedFilter | null = null
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

			// advanced filters
			if (advancedFilter) {
				if (advancedFilter.readyToMake) {
					query = query.whereIn(
						'r.RecipeId',
						this.db
							.table('availablerecipes')
							.select('RecipeId')
							.where('WorkspaceId', workspaceId)
							.groupBy('RecipeId')
					);
				}

				if (advancedFilter.ingredientProductId) {
					query = query.whereIn(
						'r.RecipeId',
						this.db
							.table('basicrecipestep as rs')
							.select('rs.RecipeId')
							.where('rs.ProductId', advancedFilter.ingredientProductId)
					);
				}

				if (advancedFilter.strengthMin !== undefined) {
					query = query.where('r.recipeStrengthRating', '>=', advancedFilter.strengthMin);
				}
				if (advancedFilter.strengthMax !== undefined) {
					query = query.where('r.recipeStrengthRating', '<=', advancedFilter.strengthMax);
				}

				if (advancedFilter.ingredientCountMin !== undefined || advancedFilter.ingredientCountMax !== undefined) {
					query = query.whereIn(
						'r.RecipeId',
						this.db
							.table('basicrecipestep as rs')
							.select('rs.RecipeId')
							.groupBy('rs.RecipeId')
							.having(
								this.db.query.raw(
									advancedFilter.ingredientCountMin !== undefined && advancedFilter.ingredientCountMax !== undefined
										? 'COUNT(rs.RecipeStepId) >= ? AND COUNT(rs.RecipeStepId) <= ?'
										: advancedFilter.ingredientCountMin !== undefined
											? 'COUNT(rs.RecipeStepId) >= ?'
											: 'COUNT(rs.RecipeStepId) <= ?',
									[
										...(advancedFilter.ingredientCountMin !== undefined ? [advancedFilter.ingredientCountMin] : []),
										...(advancedFilter.ingredientCountMax !== undefined ? [advancedFilter.ingredientCountMax] : []),
									]
								)
							)
					);
				}

				if (advancedFilter.preparationMethodId) {
					query = query.where('r.recipeTechniqueDescriptionId', advancedFilter.preparationMethodId);
				}
			}

			query = query.orderBy('recipeName');
			const { data, pagination } = await query.paginate({
				perPage,
				currentPage,
				isLengthAware: true,
			});
			const result = data as View.BasicRecipe[];

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
				recipe = dbResult as View.BasicRecipe;
				if (!recipe) throw Error('Recipe not found in this workspace.');
				dbResult = await trx('basicrecipestep')
					.select()
					.where({ recipeId, workspaceId })
					.orderBy('RecipeStepId', 'asc');
				recipeSteps = dbResult as View.BasicRecipeStep[];
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
			const data = dbResult as View.BasicRecipe[];
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
			// Find recipes missing exactly one ingredient (using EffectiveInStock for flexible matching)
			const result = await this.db
				.table('basicrecipe as r')
				.select('r.*')
				.where('r.workspaceId', workspaceId)
				.whereIn('r.RecipeId', function () {
					this.select('rs.RecipeId')
						.from('basicrecipestep as rs')
						.groupBy('rs.RecipeId')
						// EffectiveInStock accounts for flexible matching (ANY_IN_CATEGORY, ANY_IN_PARENT_CATEGORY)
						.havingRaw('SUM(CASE WHEN rs.EffectiveInStock = 0 THEN 1 ELSE 0 END) = 1')
						.havingRaw('COUNT(rs.RecipeStepId) > 1');
				})
				.limit(6);
			const recipes = result as View.BasicRecipe[];

			const recipesWithMissing = await Promise.all(
				recipes.map(async (recipe) => {
					// Find the missing ingredient (the one with EffectiveInStock = 0)
					const missing = await this.db
						.table('basicrecipestep')
						.select('ProductName', 'CategoryName', 'MatchMode')
						.where('RecipeId', recipe.recipeId)
						.where('WorkspaceId', workspaceId)
						.where('EffectiveInStock', 0)
						.first();
					// Show category name for flexible matches, product name for exact
					const ingredientName =
						missing?.matchMode !== 'EXACT_PRODUCT' ? missing?.categoryName : missing?.productName;
					return { ...recipe, missingIngredient: ingredientName || null };
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
			const data = dbResult as BasicRecipe[];
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
			const data = dbResult as View.BasicRecipeCategory[];
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
			return dbResult as Spirit[];
		} catch (error) {
			console.error(error);
			return [];
		}
	}

	async getSpiritById(id: number | string): Promise<Spirit | null> {
		try {
			const dbResult = await this.db.table<Spirit>('spirits').where('RecipeCategoryId', id);
			const [result] = dbResult as Spirit[];
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
			const data = dbResult as PreparationMethod[];
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
		imageUrl: string = '',
		imageCleared: boolean = false
	): Promise<QueryResult<{ recipe: View.BasicRecipe; recipeSteps: View.BasicRecipeStep[] }>> {
		// imageUrl: pre-uploaded URL from /api/upload/image (empty if no new image)
		// imageCleared: user explicitly removed the image
		const recipeImageUrl = imageCleared ? null : imageUrl || null;

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

				const oldRecipe = await trx('recipe')
					.select('RecipeDescriptionId', 'RecipeCategoryId', 'RecipeImageUrl')
					.where('RecipeId', recipe.recipeId || -1)
					.where('workspaceId', workspaceId)
					.first();

				// create new recipe
				if (!oldRecipe) {
					[dbResult] = await trx('recipedescription').insert({
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

					if (recipeImageUrl !== null || imageCleared) {
						// Delete old image from storage when replacing or clearing
						if (oldRecipe.recipeImageUrl) {
							await deleteSignedUrl(oldRecipe.recipeImageUrl);
						}
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
						categoryId,
						matchMode,
						productIdQuantityInMilliliters,
						productIdQuantityUnit,
						recipeStepDescription,
					}) => ({
						recipeId: keys.recipeId || 0,
						productId,
						categoryId: categoryId || null,
						matchMode: matchMode || 'EXACT_PRODUCT',
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
				newRecipe.recipe = dbResult as View.BasicRecipe;

				dbResult = await trx('basicrecipestep')
					.select()
					.where({ recipeId: keys.recipeId, workspaceId });
				newRecipe.recipeSteps = dbResult as View.BasicRecipeStep[];
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

				const [parentRow] = dbResult as any[];
				if (!parentRow) throw new Error('Recipe not found in this workspace.');

				const { recipeDescriptionId, recipeImageUrl } = parentRow;

				const deletedRows = await trx('recipedescription')
					.where('RecipeDescriptionId', recipeDescriptionId)
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

	// Workspace featured management
	async getFeatured(workspaceId: string): Promise<View.BasicRecipe[]> {
		try {
			const dbResult = await this.db
				.table('basicrecipe as r')
				.join('workspacefeatured as wf', function () {
					this.on('r.RecipeId', '=', 'wf.recipeId').andOn('r.WorkspaceId', '=', 'wf.workspaceId');
				})
				.where('wf.workspaceId', workspaceId)
				.orderBy('wf.featuredOrder', 'asc')
				.select('r.*');
			return dbResult as View.BasicRecipe[];
		} catch (error: any) {
			console.error('Error getting featured recipes:', error.message);
			return [];
		}
	}

	async addFeatured(workspaceId: string, recipeId: number): Promise<QueryResult> {
		try {
			// get max order
			const maxOrderResult = await this.db
				.table('workspacefeatured')
				.where({ workspaceId })
				.max('featuredOrder as maxOrder')
				.first<{ maxOrder: number | null }>();
			const nextOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

			await this.db.table('workspacefeatured').insert({
				workspaceId,
				recipeId,
				featuredOrder: nextOrder,
			});
			return { status: 'success' };
		} catch (error: any) {
			if (error.code === 'ER_DUP_ENTRY') {
				return { status: 'error', error: 'Recipe is already featured.' };
			}
			console.error('Error adding featured recipe:', error.message);
			return { status: 'error', error: 'Failed to add featured recipe.' };
		}
	}

	async removeFeatured(workspaceId: string, recipeId: number): Promise<QueryResult> {
		try {
			const rowsDeleted = await this.db
				.table('workspacefeatured')
				.where({ workspaceId, recipeId })
				.del();
			if (rowsDeleted === 0) {
				return { status: 'error', error: 'Featured recipe not found.' };
			}
			return { status: 'success' };
		} catch (error: any) {
			console.error('Error removing featured recipe:', error.message);
			return { status: 'error', error: 'Failed to remove featured recipe.' };
		}
	}

	async isFeatured(workspaceId: string, recipeId: number): Promise<boolean> {
		try {
			const dbResult = await this.db
				.table('workspacefeatured')
				.where({ workspaceId, recipeId })
				.first();
			return !!dbResult;
		} catch (error: any) {
			console.error('Error checking featured:', error.message);
			return false;
		}
	}

	async toggleFeatured(
		workspaceId: string,
		recipeId: number
	): Promise<QueryResult<{ isFeatured: boolean }>> {
		try {
			const exists = await this.isFeatured(workspaceId, recipeId);
			if (exists) {
				const result = await this.removeFeatured(workspaceId, recipeId);
				if (result.status === 'error') return result;
				return { status: 'success', data: { isFeatured: false } };
			} else {
				const result = await this.addFeatured(workspaceId, recipeId);
				if (result.status === 'error') return result;
				return { status: 'success', data: { isFeatured: true } };
			}
		} catch (error: any) {
			console.error('Error toggling featured:', error.message);
			return { status: 'error', error: 'Failed to toggle featured.' };
		}
	}

	async reorderFeatured(workspaceId: string, orderedRecipeIds: number[]): Promise<QueryResult> {
		try {
			await this.db.query.transaction(async (trx) => {
				for (let i = 0; i < orderedRecipeIds.length; i++) {
					await trx('workspacefeatured')
						.where({ workspaceId, recipeId: orderedRecipeIds[i] })
						.update({ featuredOrder: i });
				}
			});
			return { status: 'success' };
		} catch (error: any) {
			console.error('Error reordering featured recipes:', error.message);
			return { status: 'error', error: 'Failed to reorder featured recipes.' };
		}
	}
}
