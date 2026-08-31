// catalog domain repository
import type {
	AdvancedFilter,
	BasicRecipe,
	PaginationResult,
	PreparationMethod,
	QueryRequest,
	QueryResult,
	Spirit,
	StepExtras,
	Substitute,
	Table,
	View,
} from '$lib/types';
import type { RecipeInsightLinks } from '$lib/types/generators';

import { DbProvider } from '../db';
import { deleteCachedContent } from '../generators/cache';
import { Logger } from '../logger';
import { copyGcsFile, deleteSignedUrl } from '../storage';
import { getGlobalWorkspace } from '../workspace';
import { BaseRepository, emptyPagination } from './base.repository';

// imported categories must always land in a group (a null group broke role grouping — see
// defects.md). the source is grouped, so this only catches a source that's somehow null.
const FALLBACK_GROUP = 8; // "Other"

// inventory rows we read while resolving step images + substitutes
type InventoryRow = {
	productId: number;
	productName: string;
	categoryId: number;
	parentCategoryId: number | null;
	productImageUrl: string | null;
	productInStockQuantity: number;
};

// step extras with nothing resolved — used as a graceful fallback
function emptyExtras(step: View.BasicRecipeStep): StepExtras {
	return {
		recipeStepId: step.recipeStepId ?? 0,
		productImageUrl: null,
		matchLabel: null,
		substitutes: [],
	};
}

export class CatalogRepository extends BaseRepository {
	constructor(db: DbProvider) {
		super(db);
	}

	// a bar sees its own recipes unioned with the global catalog, minus: global originals it has
	// already forked (its copy shadows them), recipes it hid, and retired global rows.
	private scopeVisible(query: any, alias: string, viewerId: string): any {
		const globalId = getGlobalWorkspace();
		const workspaces = viewerId === globalId ? [globalId] : [viewerId, globalId];
		return query
			.whereIn(`${alias}.WorkspaceId`, workspaces)
			.whereNotIn(
				`${alias}.RecipeId`,
				this.db
					.table('recipe')
					.select('SourceRecipeId')
					.where('WorkspaceId', viewerId)
					.whereNotNull('SourceRecipeId')
			)
			.whereNotIn(
				`${alias}.RecipeId`,
				this.db.table('workspacehidden').select('RecipeId').where('WorkspaceId', viewerId)
			)
			.whereNotIn(`${alias}.RecipeId`, this.db.table('recipe').select('RecipeId').where('Retired', true));
	}

	async findAll(
		workspaceId: string,
		currentPage: number,
		perPage: number = 25,
		filter: (Partial<View.BasicRecipe> & Partial<View.BasicRecipeStep>) | null = null,
		advancedFilter: AdvancedFilter | null = null,
		includeUnpublished: boolean = false
	): Promise<PaginationResult<View.BasicRecipe[]>> {
		try {
			let query = this.scopeVisible(this.db.table('basicrecipe as r').select(), 'r', workspaceId);

			// hide drafts from everyone except workspace owners/editors
			if (!includeUnpublished) query = query.where('r.published', true);

			// "available only" — recipes makeable from this bar's overlay stock
			if (filter?.productInStockQuantity) {
				query = query.whereIn(
					'r.RecipeId',
					this.db.table('availablerecipes').select('RecipeId').where('WorkspaceId', workspaceId)
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

				// AND: recipe must contain ALL of these ingredients
				if (advancedFilter.ingredientInclude?.length) {
					for (const productId of advancedFilter.ingredientInclude) {
						query = query.whereIn(
							'r.RecipeId',
							this.db
								.table('basicrecipestep as rs')
								.select('rs.RecipeId')
								.where('rs.ProductId', productId)
						);
					}
				}

				// OR: recipe must contain at least one of these ingredients
				if (advancedFilter.ingredientAny?.length) {
					query = query.whereIn(
						'r.RecipeId',
						this.db
							.table('basicrecipestep as rs')
							.select('rs.RecipeId')
							.whereIn('rs.ProductId', advancedFilter.ingredientAny)
					);
				}

				// NOT: recipe must NOT contain any of these ingredients
				if (advancedFilter.ingredientExclude?.length) {
					query = query.whereNotIn(
						'r.RecipeId',
						this.db
							.table('basicrecipestep as rs')
							.select('rs.RecipeId')
							.whereIn('rs.ProductId', advancedFilter.ingredientExclude)
					);
				}

				if (advancedFilter.strengthMin !== undefined) {
					query = query.where('r.recipeStrengthRating', '>=', advancedFilter.strengthMin);
				}
				if (advancedFilter.strengthMax !== undefined) {
					query = query.where('r.recipeStrengthRating', '<=', advancedFilter.strengthMax);
				}

				if (
					advancedFilter.ingredientCountMin !== undefined ||
					advancedFilter.ingredientCountMax !== undefined
				) {
					query = query.whereIn(
						'r.RecipeId',
						this.db
							.table('basicrecipestep as rs')
							.select('rs.RecipeId')
							.groupBy('rs.RecipeId')
							.having(
								this.db.query.raw(
									advancedFilter.ingredientCountMin !== undefined &&
										advancedFilter.ingredientCountMax !== undefined
										? 'COUNT(rs.RecipeStepId) >= ? AND COUNT(rs.RecipeStepId) <= ?'
										: advancedFilter.ingredientCountMin !== undefined
											? 'COUNT(rs.RecipeStepId) >= ?'
											: 'COUNT(rs.RecipeStepId) <= ?',
									[
										...(advancedFilter.ingredientCountMin !== undefined
											? [advancedFilter.ingredientCountMin]
											: []),
										...(advancedFilter.ingredientCountMax !== undefined
											? [advancedFilter.ingredientCountMax]
											: []),
									]
								)
							)
					);
				}

				if (advancedFilter.preparationMethodId) {
					query = query.where('r.recipeTechniqueDescriptionId', advancedFilter.preparationMethodId);
				}

				if (advancedFilter.mood) {
					const moodIds = advancedFilter.mood.split(',').filter(Boolean);
					const moodSql: Record<string, string> = {
						'strong-dry': '(r.recipeStrengthRating >= 6 AND r.recipeDrynessRating >= 6)',
						'sweet-easy': '(r.recipeSweetnessRating >= 6 AND r.recipeStrengthRating <= 5)',
						balanced: `(
							ABS(r.recipeSweetnessRating - (r.recipeSweetnessRating + r.recipeDrynessRating + r.recipeStrengthRating + r.recipeVersatilityRating) / 4) <= 2.5
							AND ABS(r.recipeDrynessRating - (r.recipeSweetnessRating + r.recipeDrynessRating + r.recipeStrengthRating + r.recipeVersatilityRating) / 4) <= 2.5
							AND ABS(r.recipeStrengthRating - (r.recipeSweetnessRating + r.recipeDrynessRating + r.recipeStrengthRating + r.recipeVersatilityRating) / 4) <= 2.5
							AND ABS(r.recipeVersatilityRating - (r.recipeSweetnessRating + r.recipeDrynessRating + r.recipeStrengthRating + r.recipeVersatilityRating) / 4) <= 2.5
						)`,
						'bold-complex': '(r.recipeStrengthRating >= 6 AND r.recipeVersatilityRating >= 6)',
					};
					const clauses = moodIds.map((id) => moodSql[id]).filter(Boolean);
					if (clauses.length > 0) {
						query = query.whereRaw(`(${clauses.join(' OR ')})`);
					}
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
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { data: [], pagination: emptyPagination };
		}
	}

	async getRecipeCount(workspaceId: string): Promise<number> {
		try {
			const result = (await this.db
				.table('basicrecipe')
				.where('workspaceId', workspaceId)
				.where('published', true)
				.count('* as count')
				.first()) as { count: number } | undefined;
			return Number(result?.count) || 0;
		} catch (error: any) {
			console.error('Failed to get recipe count:', error.message);
			Logger.error(
				`Failed to get recipe count: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return 0;
		}
	}

	// check if a recipe was already imported from a source
	async findImportedRecipe(
		workspaceId: string,
		sourceRecipeId: number,
		sourceWorkspaceId: string
	): Promise<View.BasicRecipe | null> {
		try {
			const result = await this.db
				.table('basicrecipe')
				.where({
					SourceRecipeId: sourceRecipeId,
					SourceWorkspaceId: sourceWorkspaceId,
					WorkspaceId: workspaceId,
				})
				.first();
			return (result as View.BasicRecipe) || null;
		} catch {
			return null;
		}
	}

	// find a recipe by name in a workspace
	async findByName(workspaceId: string, recipeName: string): Promise<View.BasicRecipe | null> {
		try {
			const result = await this.db
				.table('basicrecipe')
				.where({ RecipeName: recipeName, WorkspaceId: workspaceId })
				.first();
			return (result as View.BasicRecipe) || null;
		} catch {
			return null;
		}
	}

	// resolves the AI insights' text suggestions into real catalog links:
	// - similar/variation names -> matching recipes in this workspace or the global catalog
	// - related recipes -> real recipes sharing the base spirit
	// - substitutions -> sibling products from the category/parent-category graph
	// degrades to empty arrays on any failure so the insights section still renders.
	async getInsightLinks(
		workspaceId: string,
		globalWorkspaceId: string,
		recipeId: number,
		aiSimilar: string[],
		aiVariations: { name: string; description: string }[]
	): Promise<RecipeInsightLinks> {
		const empty: RecipeInsightLinks = {
			similar: aiSimilar.map((name) => ({ name, recipeId: null, imageUrl: null })),
			variations: aiVariations.map((v) => ({ ...v, recipeId: null })),
			related: [],
			substitutions: [],
		};

		try {
			const workspaceIds = [...new Set([workspaceId, globalWorkspaceId].filter(Boolean))];
			const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

			const current = (await this.db
				.table('basicrecipe')
				.where({ recipeId })
				.whereIn('workspaceId', workspaceIds)
				.first()) as View.BasicRecipe | undefined;

			const steps = (await this.db
				.table('basicrecipestep')
				.where({ recipeId })
				.whereIn('workspaceId', workspaceIds)) as View.BasicRecipeStep[];

			const recipes = (await this.db
				.table('basicrecipe')
				.whereIn('workspaceId', workspaceIds)
				.where('published', true)
				.select(
					'recipeId',
					'recipeName',
					'recipeCategoryId',
					'recipeImageUrl',
					'workspaceId'
				)) as View.BasicRecipe[];

			// name -> recipe map for matching AI suggestions; prefer this workspace over global
			const byName = new Map<string, View.BasicRecipe>();
			for (const r of recipes) {
				if (r.recipeId === recipeId) continue;
				const key = norm(r.recipeName);
				const existing = byName.get(key);
				if (!existing || r.workspaceId === workspaceId) byName.set(key, r);
			}

			const similar = aiSimilar.map((name) => {
				const m = byName.get(norm(name));
				return { name, recipeId: m?.recipeId ?? null, imageUrl: m?.recipeImageUrl ?? null };
			});

			const variations = aiVariations.map((v) => {
				const m = byName.get(norm(v.name));
				return { name: v.name, description: v.description, recipeId: m?.recipeId ?? null };
			});

			// real recipes sharing the base spirit — always linkable, deduped by name
			const related: RecipeInsightLinks['related'] = [];
			const seen = new Set<string>();
			for (const r of recipes) {
				if (r.recipeId === recipeId) continue;
				if (current && r.recipeCategoryId !== current.recipeCategoryId) continue;
				const key = norm(r.recipeName);
				if (seen.has(key)) continue;
				seen.add(key);
				related.push({
					recipeId: r.recipeId,
					recipeName: r.recipeName,
					imageUrl: r.recipeImageUrl ?? null,
				});
				if (related.length >= 8) break;
			}

			// sibling products for substitutions, from the same category then parent category
			const categoryIds = [...new Set(steps.map((s) => s.categoryId).filter(Boolean))];
			const parentIds = [...new Set(steps.map((s) => s.parentCategoryId).filter(Boolean))];

			let products: InventoryRow[] = [];
			if (categoryIds.length || parentIds.length) {
				products = (await this.db
					.table('inventory')
					.whereIn('workspaceId', workspaceIds)
					.where(function (this: any) {
						if (categoryIds.length) this.whereIn('categoryId', categoryIds);
						if (parentIds.length) this.orWhereIn('parentCategoryId', parentIds);
					})
					.select(
						'productId',
						'productName',
						'categoryId',
						'parentCategoryId',
						'productInStockQuantity'
					)) as InventoryRow[];
			}

			const substitutions = steps
				.map((step) => {
					let pool = products.filter(
						(p) => p.categoryId === step.categoryId && p.productId !== step.productId
					);
					// fall back to the wider parent category when a category has no siblings
					if (pool.length === 0 && step.parentCategoryId) {
						pool = products.filter(
							(p) => p.parentCategoryId === step.parentCategoryId && p.productId !== step.productId
						);
					}

					// dedupe by name, in-stock first, cap at 4
					const byProductName = new Map<string, InventoryRow>();
					for (const p of pool) {
						const key = norm(p.productName);
						const existing = byProductName.get(key);
						if (!existing || (p.productInStockQuantity > 0 && existing.productInStockQuantity <= 0))
							byProductName.set(key, p);
					}
					const options = [...byProductName.values()]
						.sort((a, b) =>
							a.productInStockQuantity > 0 === b.productInStockQuantity > 0
								? a.productName.localeCompare(b.productName)
								: a.productInStockQuantity > 0
									? -1
									: 1
						)
						.slice(0, 4)
						.map((p) => ({
							productId: p.productId,
							productName: p.productName,
							inStock: p.productInStockQuantity > 0,
						}));

					if (options.length === 0) return null;
					return {
						ingredient: step.productName || step.categoryName,
						category: step.categoryName,
						options,
					};
				})
				.filter((s): s is RecipeInsightLinks['substitutions'][number] => s !== null);

			return { similar, variations, related, substitutions };
		} catch (error: any) {
			console.error('Failed to build insight links:', error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return empty;
		}
	}

	async findById(
		workspaceId: string,
		recipeId: string,
		includeUnpublished: boolean = false
	): Promise<QueryResult<{ recipe: View.BasicRecipe; recipeSteps: View.BasicRecipeStep[] }>> {
		try {
			let recipe: View.BasicRecipe | undefined;
			let recipeSteps: View.BasicRecipeStep[] | undefined;

			await this.db.query.transaction(async (trx) => {
				// resolve from the bar's own recipes or the global catalog it can see
				const globalId = getGlobalWorkspace();
				const recipeQuery = trx('basicrecipe')
					.select()
					.where({ recipeId })
					.whereIn('WorkspaceId', workspaceId === globalId ? [globalId] : [workspaceId, globalId]);
				// drafts resolve only for owners/editors; others get the not-found path
				if (!includeUnpublished) recipeQuery.where({ published: true });
				const [dbResult] = await recipeQuery;
				recipe = dbResult as View.BasicRecipe;
				if (!recipe) throw Error('Recipe not found in this workspace.');
				recipeSteps = (await trx('basicrecipestep')
					.select()
					.where({ recipeId, workspaceId: recipe.workspaceId })
					.orderBy('RecipeStepId', 'asc')) as View.BasicRecipeStep[];
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

	// resolves per-step images + acceptable substitutes from the workspace inventory.
	// one query covers the whole recipe; failures degrade to empty extras (images/subs just hide).
	async getStepExtras(workspaceId: string, steps: View.BasicRecipeStep[]): Promise<StepExtras[]> {
		try {
			const categoryIds = [
				...new Set(steps.map((s) => s.categoryId).filter((id): id is number => !!id)),
			];
			const parentIds = [
				...new Set(steps.map((s) => s.parentCategoryId).filter((id): id is number => !!id)),
			];

			if (categoryIds.length === 0 && parentIds.length === 0) {
				return steps.map((s) => emptyExtras(s));
			}

			const rows = (await this.db
				.table('inventory')
				.where('workspaceId', workspaceId)
				.where(function () {
					if (categoryIds.length) this.whereIn('categoryId', categoryIds);
					if (parentIds.length) this.orWhereIn('parentCategoryId', parentIds);
				})
				.select(
					'productId',
					'productName',
					'categoryId',
					'parentCategoryId',
					'productImageUrl',
					'productInStockQuantity'
				)) as InventoryRow[];

			const imageByProduct = new Map<number, string | null>(
				rows.map((r) => [r.productId, r.productImageUrl])
			);

			return steps.map((step) => {
				const matchMode = step.matchMode ?? 'EXACT_PRODUCT';

				// prefer the step's own product image, but many products have none — fall back to any
				// sibling in the same category so e.g. a generic "Lime Juice" step still shows the
				// category's bottle rather than an empty tile. empty strings count as "no image".
				const own = imageByProduct.get(step.productId);
				const productImageUrl =
					(own && own.trim()) ||
					rows.find((r) => r.categoryId === step.categoryId && r.productImageUrl?.trim())
						?.productImageUrl ||
					null;

				let matchLabel: string | null = null;
				let candidates: InventoryRow[] = [];
				if (matchMode === 'ANY_IN_CATEGORY') {
					matchLabel = `Any ${step.categoryName}`;
					candidates = rows.filter((r) => r.categoryId === step.categoryId);
				} else if (matchMode === 'ANY_IN_PARENT_CATEGORY' && step.parentCategoryId) {
					matchLabel = `Any ${step.parentCategoryName ?? step.categoryName}`;
					candidates = rows.filter((r) => r.parentCategoryId === step.parentCategoryId);
				}

				// drop the step's own product; in-stock first, then alphabetical
				const substitutes: Substitute[] = candidates
					.filter((r) => r.productId !== step.productId)
					.map((r) => ({
						productId: r.productId,
						productName: r.productName,
						imageUrl: r.productImageUrl,
						inStock: r.productInStockQuantity > 0,
					}))
					.sort((a, b) =>
						a.inStock === b.inStock
							? a.productName.localeCompare(b.productName)
							: a.inStock
								? -1
								: 1
					);

				return { recipeStepId: step.recipeStepId ?? 0, productImageUrl, matchLabel, substitutes };
			});
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return steps.map((s) => emptyExtras(s));
		}
	}

	async getAvailableRecipes(workspaceId: string): Promise<QueryResult<View.BasicRecipe[]>> {
		try {
			let query = this.scopeVisible(this.db.table('basicrecipe'), 'basicrecipe', workspaceId)
				.where('Published', true)
				.whereIn(
					'RecipeId',
					this.db.table('availablerecipes').select('RecipeId').where('WorkspaceId', workspaceId)
				);
			const data = (await query) as View.BasicRecipe[];
			return { status: 'success', data };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Unable to get recipes.' };
		}
	}

	async getAlmostThereRecipes(
		workspaceId: string
	): Promise<Array<View.BasicRecipe & { missingIngredient: string | null }>> {
		try {
			// recipes missing exactly one ingredient for this bar's overlay stock
			const result = await this.scopeVisible(
				this.db.table('basicrecipe as r').select('r.*'),
				'r',
				workspaceId
			)
				.whereIn(
					'r.RecipeId',
					this.db
						.table('recipestepstock')
						.select('RecipeId')
						.where('WorkspaceId', workspaceId)
						.groupBy('RecipeId')
						.havingRaw('SUM(CASE WHEN EffectiveInStock = 0 THEN 1 ELSE 0 END) = 1')
						.havingRaw('COUNT(RecipeStepId) > 1')
				)
				.limit(6);
			const recipes = result as View.BasicRecipe[];

			const recipesWithMissing = await Promise.all(
				recipes.map(async (recipe) => {
					// the single out-of-stock step for this bar
					const missing = await this.db
						.table('basicrecipestep as rs')
						.join('recipestepstock as ss', 'rs.RecipeStepId', 'ss.RecipeStepId')
						.select('rs.ProductName', 'rs.CategoryName', 'rs.MatchMode')
						.where('rs.RecipeId', recipe.recipeId)
						.where('ss.WorkspaceId', workspaceId)
						.where('ss.EffectiveInStock', 0)
						.first();
					// Show category name for flexible matches, product name for exact
					const ingredientName =
						missing?.matchMode !== 'EXACT_PRODUCT' ? missing?.categoryName : missing?.productName;
					return { ...recipe, missingIngredient: ingredientName || null };
				})
			);

			return recipesWithMissing;
		} catch (e: any) {
			console.error('Failed to get almost-there recipes:', e);
			Logger.error(
				`Failed to get almost-there recipes: ${e.sqlMessage || e.message}`,
				e.sql || e.stackTrace
			);
			return [];
		}
	}

	async getRecipesByCategory(
		workspaceId: string,
		recipeCategoryId: number | string | null = null
	): Promise<QueryResult<BasicRecipe[]>> {
		try {
			let query = this.scopeVisible(
				this.db.table<BasicRecipe>('basicrecipe'),
				'basicrecipe',
				workspaceId
			).where('published', true);
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
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return [];
		}
	}

	async getSpiritById(id: number | string): Promise<Spirit | null> {
		try {
			const dbResult = await this.db.table<Spirit>('spirits').where('RecipeCategoryId', id);
			const [result] = dbResult as Spirit[];
			if (!result) throw Error('Spirit not found.');
			return result;
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return null;
		}
	}

	// updates the global recipecategorydescription row for a spirit (admin-only, gated at the route)
	async updateSpirit(
		recipeCategoryId: number,
		descriptionText: string | null,
		imageUrl: string = '',
		imageCleared: boolean = false
	): Promise<QueryResult<Spirit>> {
		try {
			const existing = await this.db
				.table('recipecategorydescription')
				.select('RecipeCategoryDescriptionImageUrl')
				.where('RecipeCategoryId', recipeCategoryId)
				.first();

			if (!existing) {
				return { status: 'error', error: 'Category not found.' };
			}

			const update: Record<string, unknown> = {
				RecipeCategoryDescriptionText: descriptionText,
			};

			// only touch the image column when a new one was uploaded or it was cleared
			if (imageCleared || imageUrl) {
				if (existing.recipeCategoryDescriptionImageUrl) {
					await deleteSignedUrl(existing.recipeCategoryDescriptionImageUrl);
				}
				update.RecipeCategoryDescriptionImageUrl = imageCleared ? null : imageUrl;
			}

			await this.db
				.table('recipecategorydescription')
				.where('RecipeCategoryId', recipeCategoryId)
				.update(update);

			const updated = await this.getSpiritById(recipeCategoryId);
			if (!updated) return { status: 'error', error: 'Category not found.' };
			return { status: 'success', data: updated };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not update category.' };
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
						InsightsEnabled: recipe.insightsEnabled ?? true,
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
						InsightsEnabled: recipe.insightsEnabled ?? true,
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

	// import a recipe from one workspace into another
	async importRecipe(
		targetWorkspaceId: string,
		sourceRecipeId: number,
		sourceWorkspaceId: string
	): Promise<
		QueryResult<{
			recipe: View.BasicRecipe;
			recipeSteps: View.BasicRecipeStep[];
			alreadyImported?: boolean;
		}>
	> {
		try {
			let result: {
				recipe: View.BasicRecipe;
				recipeSteps: View.BasicRecipeStep[];
				alreadyImported?: boolean;
			} = {
				recipe: {} as View.BasicRecipe,
				recipeSteps: [],
			};

			await this.db.query.transaction(async (trx) => {
				// 1. already-imported check
				const existing = await trx('recipe')
					.where({
						SourceRecipeId: sourceRecipeId,
						SourceWorkspaceId: sourceWorkspaceId,
						WorkspaceId: targetWorkspaceId,
					})
					.first();
				if (existing) {
					const [imported] = await trx('basicrecipe').where({
						RecipeId: existing.recipeId,
						WorkspaceId: targetWorkspaceId,
					});
					result = { recipe: imported as View.BasicRecipe, recipeSteps: [], alreadyImported: true };
					return;
				}

				// 2. fetch source recipe + steps
				const [sourceRecipe] = await trx('basicrecipe').where({
					RecipeId: sourceRecipeId,
					WorkspaceId: sourceWorkspaceId,
				});
				if (!sourceRecipe) throw new Error('Source recipe not found.');
				// can't import a draft — it's not live yet
				if (!sourceRecipe.published) throw new Error('Source recipe is not published.');

				const sourceSteps = (await trx('basicrecipestep')
					.where({ RecipeId: sourceRecipeId, WorkspaceId: sourceWorkspaceId })
					.orderBy('RecipeStepId', 'asc')) as View.BasicRecipeStep[];

				// 3. validate eligibility — all steps must use category matching
				const ineligible = sourceSteps.find(
					(s) => s.matchMode !== 'ANY_IN_CATEGORY' && s.matchMode !== 'ANY_IN_PARENT_CATEGORY'
				);
				if (ineligible) {
					throw new Error('Recipe contains EXACT_PRODUCT steps and cannot be imported.');
				}

				// 4. resolve categories in target workspace
				const categoryMap = new Map<string, number>();
				for (const step of sourceSteps) {
					const catName = step.categoryName;
					if (!catName || categoryMap.has(catName)) continue;

					let cat = await trx('category')
						.where({ CategoryName: catName, WorkspaceId: targetWorkspaceId })
						.first();

					if (!cat) {
						// look up source category to preserve group assignment
						const sourceCat = await trx('category').where({ CategoryId: step.categoryId }).first();
						const categoryGroupId = sourceCat?.categoryGroupId ?? FALLBACK_GROUP;

						// resolve parent category if source step has one
						let parentCategoryId: number | null = null;
						if (step.parentCategoryName) {
							let parent = await trx('category')
								.where({ CategoryName: step.parentCategoryName, WorkspaceId: targetWorkspaceId })
								.first();
							if (!parent) {
								// look up source parent for its group
								const sourceParent = await trx('category')
									.where({ CategoryName: step.parentCategoryName, WorkspaceId: sourceWorkspaceId })
									.first();
								const [parentId] = await trx('category').insert({
									WorkspaceId: targetWorkspaceId,
									CategoryName: step.parentCategoryName,
									CategoryGroupId: sourceParent?.categoryGroupId ?? FALLBACK_GROUP,
								});
								parentCategoryId = parentId;
							} else {
								parentCategoryId = parent.categoryId;
							}
						}

						const [catId] = await trx('category').insert({
							WorkspaceId: targetWorkspaceId,
							CategoryName: catName,
							ParentCategoryId: parentCategoryId,
							CategoryGroupId: categoryGroupId,
						});
						categoryMap.set(catName, catId);
					} else {
						// backfill missing group assignment from source
						if (!cat.categoryGroupId) {
							const sourceCat = await trx('category')
								.where({ CategoryId: step.categoryId })
								.first();
							if (sourceCat?.categoryGroupId) {
								await trx('category')
									.where({ CategoryId: cat.categoryId })
									.update({ CategoryGroupId: sourceCat.categoryGroupId });
							}
						}
						categoryMap.set(catName, cat.categoryId);
					}
				}

				// 5. resolve products via category matching
				const productMap = new Map<number, number>();
				for (const step of sourceSteps) {
					const catName = step.categoryName;
					if (!catName) continue;
					const targetCategoryId = categoryMap.get(catName);
					if (!targetCategoryId || productMap.has(targetCategoryId)) continue;

					// check if user already has any product in this category
					const existingProduct = await trx('product')
						.where({ CategoryId: targetCategoryId, WorkspaceId: targetWorkspaceId })
						.first();

					if (existingProduct) {
						productMap.set(targetCategoryId, existingProduct.productId);
					} else {
						// copy source product with stock=0
						const [productId] = await trx('product').insert({
							WorkspaceId: targetWorkspaceId,
							CategoryId: targetCategoryId,
							SupplierId: 1,
							ProductName: step.productName || catName,
							ProductInStockQuantity: 0,
							ProductPricePerUnit: 0,
							ProductUnitSizeInMilliliters: 0,
							ProductProof: step.productProof || 0,
						});

						// attach canonical product image and description if available
						const canonical = await trx('productdescription')
							.where({ ProductId: step.productId })
							.first();
						if (canonical?.productDescriptionImageUrl || canonical?.productDescriptionText) {
							// copy source image into the target workspace so deletes don't cascade
							const copiedImageUrl = canonical.productDescriptionImageUrl
								? await copyGcsFile(
										canonical.productDescriptionImageUrl,
										'ingredients',
										targetWorkspaceId
									)
								: null;
							await trx('productdetail').insert({
								ProductId: productId,
								ProductImageUrl: copiedImageUrl,
								ProductDescription: canonical.productDescriptionText || null,
							});
						}

						productMap.set(targetCategoryId, productId);
					}
				}

				// 6. create recipe chain (sourceRecipe is camelCase from postProcessResponse)
				// copy source images so delete in target workspace doesn't destroy source gcs objects
				const copiedDescImageUrl = sourceRecipe.recipeDescriptionImageUrl
					? await copyGcsFile(sourceRecipe.recipeDescriptionImageUrl, 'recipes', targetWorkspaceId)
					: null;
				const copiedRecipeImageUrl = sourceRecipe.recipeImageUrl
					? await copyGcsFile(sourceRecipe.recipeImageUrl, 'recipes', targetWorkspaceId)
					: null;

				const [descId] = await trx('recipedescription').insert({
					RecipeDescription: sourceRecipe.recipeDescription,
					RecipeDescriptionImageUrl: copiedDescImageUrl,
					RecipeSweetnessRating: sourceRecipe.recipeSweetnessRating,
					RecipeDrynessRating: sourceRecipe.recipeDrynessRating,
					RecipeStrengthRating: sourceRecipe.recipeStrengthRating,
					RecipeVersatilityRating: sourceRecipe.recipeVersatilityRating,
				});

				const [newRecipeId] = await trx('recipe').insert({
					WorkspaceId: targetWorkspaceId,
					RecipeCategoryId: sourceRecipe.recipeCategoryId,
					RecipeDescriptionId: descId,
					RecipeName: sourceRecipe.recipeName,
					RecipeImageUrl: copiedRecipeImageUrl,
					SourceRecipeId: sourceRecipeId,
					SourceWorkspaceId: sourceWorkspaceId,
				});

				await trx('recipetechnique').insert({
					RecipeTechniqueDescriptionId: sourceRecipe.recipeTechniqueDescriptionId,
					RecipeId: newRecipeId,
				});

				for (const step of sourceSteps) {
					const targetCategoryId = categoryMap.get(step.categoryName || '');
					const targetProductId = targetCategoryId ? productMap.get(targetCategoryId) : null;
					if (!targetCategoryId || !targetProductId) continue;

					await trx('recipestep').insert({
						RecipeId: newRecipeId,
						ProductId: targetProductId,
						CategoryId: targetCategoryId,
						MatchMode: 'ANY_IN_CATEGORY',
						ProductIdQuantityInMilliliters: step.productIdQuantityInMilliliters,
						ProductIdQuantityUnit: step.productIdQuantityUnit,
						RecipeStepDescription: step.recipeStepDescription,
					});
				}

				// 7. fetch the created recipe back via views
				const [newRecipe] = await trx('basicrecipe').where({
					RecipeId: newRecipeId,
					WorkspaceId: targetWorkspaceId,
				});
				const newSteps = await trx('basicrecipestep')
					.where({ RecipeId: newRecipeId, WorkspaceId: targetWorkspaceId })
					.orderBy('RecipeStepId', 'asc');

				result = {
					recipe: newRecipe as View.BasicRecipe,
					recipeSteps: newSteps as View.BasicRecipeStep[],
				};
			});

			return { status: 'success', data: result };
		} catch (error: any) {
			console.error(error.message);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: error.message || 'Cannot import recipe.' };
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

			// clean up cached generated content
			deleteCachedContent('recipe-insights', recipeId).catch((err) => {
				console.error('failed to clean up cached content:', err);
				Logger.error(`failed to clean up cached content: ${err.message}`, err.stack);
			});

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
				.where('r.Published', true)
				.orderBy('wf.featuredOrder', 'asc')
				.select('r.*');
			return dbResult as View.BasicRecipe[];
		} catch (error: any) {
			console.error('Error getting featured recipes:', error.message);
			Logger.error(
				`Error getting featured recipes: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
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
			Logger.error(
				`Error adding featured recipe: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
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
			Logger.error(
				`Error removing featured recipe: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
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
			Logger.error(
				`Error checking featured: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
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
			Logger.error(
				`Error toggling featured: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return { status: 'error', error: 'Failed to toggle featured.' };
		}
	}

	// flip a recipe between draft and published
	async togglePublished(
		workspaceId: string,
		recipeId: number
	): Promise<QueryResult<{ published: boolean }>> {
		try {
			const row = await this.db
				.table('recipe')
				.where({ RecipeId: recipeId, WorkspaceId: workspaceId })
				.first();
			if (!row) return { status: 'error', error: 'Recipe not found.' };

			const published = !row.published;
			await this.db
				.table('recipe')
				.where({ RecipeId: recipeId, WorkspaceId: workspaceId })
				.update({ Published: published });
			return { status: 'success', data: { published } };
		} catch (error: any) {
			console.error('Error toggling published:', error.message);
			Logger.error(
				`Error toggling published: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return { status: 'error', error: 'Failed to toggle published.' };
		}
	}

	async getRecipesByIds(workspaceId: string, recipeIds: number[]): Promise<View.BasicRecipe[]> {
		if (recipeIds.length === 0) return [];
		try {
			const query = this.scopeVisible(this.db.table('basicrecipe'), 'basicrecipe', workspaceId)
				.where('Published', true)
				.whereIn('RecipeId', recipeIds);
			return (await query) as View.BasicRecipe[];
		} catch (error: any) {
			console.error('Error getting recipes by ids:', error.message);
			Logger.error(
				`Error getting recipes by ids: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return [];
		}
	}

	async getHighestImpactIngredients(
		workspaceId: string
	): Promise<{ ingredientName: string; unlockableRecipes: number }[]> {
		try {
			const visibleRecipeIds = this.scopeVisible(
				this.db.table('basicrecipe as r'),
				'r',
				workspaceId
			).select('r.RecipeId');

			const result = await this.db
				.table('basicrecipestep as rs')
				.join('recipestepstock as ss', 'rs.RecipeStepId', 'ss.RecipeStepId')
				.select(
					this.db.query.raw(
						"CASE WHEN rs.MatchMode != 'EXACT_PRODUCT' THEN rs.CategoryName ELSE rs.ProductName END as ingredientName"
					)
				)
				.count('* as unlockableRecipes')
				.where('ss.WorkspaceId', workspaceId)
				.where('ss.EffectiveInStock', 0)
				.whereIn('rs.RecipeId', visibleRecipeIds)
				.whereIn(
					'rs.RecipeId',
					this.db
						.table('recipestepstock')
						.select('RecipeId')
						.where('WorkspaceId', workspaceId)
						.groupBy('RecipeId')
						.havingRaw('SUM(CASE WHEN EffectiveInStock = 0 THEN 1 ELSE 0 END) = 1')
						.havingRaw('COUNT(RecipeStepId) > 1')
				)
				.groupBy('ingredientName')
				.orderBy('unlockableRecipes', 'desc')
				.limit(3);

			return (result as any[]).map((row) => ({
				ingredientName: row.ingredientName,
				unlockableRecipes: Number(row.unlockableRecipes),
			}));
		} catch (e: any) {
			console.error('Failed to get highest impact ingredients:', e);
			Logger.error(
				`Failed to get highest impact ingredients: ${e.sqlMessage || e.message}`,
				e.sql || e.stackTrace
			);
			return [];
		}
	}

	// batch compute estimated cost per available recipe in one query
	async getRecipeCosts(
		workspaceId: string
	): Promise<
		{ recipeId: number; recipeName: string; recipeImageUrl: string | null; estimatedCost: number }[]
	> {
		try {
			const base = this.db.table('basicrecipestep as rs').join('basicrecipe as r', function () {
				this.on('rs.RecipeId', '=', 'r.RecipeId').andOn('rs.WorkspaceId', '=', 'r.WorkspaceId');
			});
			const result = await this.scopeVisible(base, 'r', workspaceId)
				.where('r.Published', true)
				.whereIn(
					'rs.RecipeId',
					this.db.table('availablerecipes').select('RecipeId').where('WorkspaceId', workspaceId)
				)
				.select(
					'rs.RecipeId',
					'r.RecipeName',
					'r.RecipeImageUrl',
					this.db.query.raw(
						`SUM(CASE
							WHEN rs.ProductUnitSizeInMilliliters > 0 AND rs.ProductPricePerUnit > 0
							THEN (rs.ProductPricePerUnit / rs.ProductUnitSizeInMilliliters) * rs.ProductIdQuantityInMilliliters
							ELSE 0
						END) as estimatedCost`
					)
				)
				.groupBy('rs.RecipeId', 'r.RecipeName', 'r.RecipeImageUrl')
				.orderBy('estimatedCost', 'asc');

			return (result as any[]).map((row) => ({
				recipeId: Number(row.recipeId),
				recipeName: row.recipeName,
				recipeImageUrl: row.recipeImageUrl || null,
				estimatedCost: Number(row.estimatedCost) || 0,
			}));
		} catch (e: any) {
			console.error('Failed to get recipe costs:', e);
			Logger.error(
				`Failed to get recipe costs: ${e.sqlMessage || e.message}`,
				e.sql || e.stackTrace
			);
			return [];
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
			Logger.error(
				`Error reordering featured recipes: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return { status: 'error', error: 'Failed to reorder featured recipes.' };
		}
	}
}
