// inventory domain repository
import type {
	Category,
	CategoryCount,
	InventoryStats,
	PaginationResult,
	Product,
	QueryResult,
	SelectOption,
	Table,
} from '$lib/types';

import { DbProvider } from '../db';
import { Logger } from '../logger';
import { deleteSignedUrl } from '../storage';
import { BaseRepository, emptyPagination, titleCase } from './base.repository';

export class InventoryRepository extends BaseRepository {
	constructor(db: DbProvider) {
		super(db);
	}

	async findAll(
		workspaceId: string,
		currentPage: number,
		perPage: number = 25,
		filter: (Partial<Product> & { stockFilter?: string }) | null = null
	): Promise<PaginationResult<Product[]>> {
		try {
			let query = this.db.table('inventory').where('workspaceId', workspaceId);

			if (filter?.productName) {
				query = query.andWhere('productName', 'like', `%${filter.productName}%`);
			}

			if (filter?.categoryId) {
				query = query.andWhere('categoryId', '=', filter.categoryId);
			}

			if (filter?.stockFilter) {
				if (filter.stockFilter === 'out-of-stock') {
					query = query.andWhere('productInStockQuantity', '=', 0);
				} else if (filter.stockFilter === 'low-stock') {
					query = query.andWhere('productInStockQuantity', '=', 1);
				} else if (filter.stockFilter === 'in-stock') {
					query = query.andWhere('productInStockQuantity', '>', 1);
				}
			} else if (typeof filter?.productInStockQuantity !== 'undefined') {
				query = query.andWhere('productInStockQuantity', '=', filter.productInStockQuantity);
			}

			const { data, pagination } = await query
				.select()
				.orderBy('productName')
				.paginate({ perPage, currentPage, isLengthAware: true });

			return { data: data as Product[], pagination };
		} catch (error: any) {
			console.error(error);
			return { data: [], pagination: emptyPagination };
		}
	}

	async findById(workspaceId: string, productId: number): Promise<Product | null> {
		try {
			let data = await this.db
				.table<Product>('inventory')
				.where('ProductId', productId)
				.where('workspaceId', workspaceId)
				.select();

			let result = data as Product[];
			if (result.length === 0) {
				throw Error('Product not found');
			}

			return result[0];
		} catch (error: any) {
			console.error(error);
			return null;
		}
	}

	async create(
		workspaceId: string,
		product: Product,
		imageUrl: string = ''
	): Promise<QueryResult<Product>> {
		try {
			let parentRowId: number | undefined;
			let childRowId: number | undefined;

			await this.db.query.transaction(async (trx) => {
				const [parentRow] = await trx('product').insert({
					workspaceId,
					CategoryId: product.categoryId,
					SupplierId: product.supplierId || 1,
					ProductName: product.productName,
					ProductInStockQuantity: product.productInStockQuantity,
					ProductUnitSizeInMilliliters: product.productUnitSizeInMilliliters,
					ProductPricePerUnit: product.productPricePerUnit,
					ProductProof: product.productProof,
				});
				parentRowId = parentRow;

				const [childRow] = await trx('productdetail')
					.insert({
						ProductId: parentRowId,
						ProductImageUrl: imageUrl || null,
						ProductDescription: product.productDescription,
						ProductSweetnessRating: product.productSweetnessRating,
						ProductDrynessRating: product.productDrynessRating,
						ProductVersatilityRating: product.productVersatilityRating,
						ProductStrengthRating: product.productStrengthRating,
					})
					.onConflict('ProductId')
					.merge();

				childRowId = childRow;
				await trx.commit();
			});

			if (!parentRowId || !childRowId) {
				throw new Error('No rows have been inserted.');
			}

			const newRow = await this.findById(workspaceId, parentRowId);
			if (!newRow) {
				throw new Error('Cannot find newly inserted item.');
			}

			return { status: 'success', data: newRow };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage, error.sql);
			return { status: 'error', error: 'Could not add new item to inventory.' };
		}
	}

	async update(
		workspaceId: string,
		product: Product,
		imageUrl: string = '',
		imageCleared: boolean = false
	): Promise<QueryResult<Product>> {
		try {
			if (!product?.productId) throw Error('No inventory ID provided.');

			// verify product belongs to workspace
			const existing = await this.findById(workspaceId, product.productId);
			if (!existing) throw Error('Product not found in this workspace.');

			// Resolve the image URL: new upload, cleared, or keep existing
			let resolvedImageUrl: string | null;
			if (imageCleared) {
				resolvedImageUrl = null;
			} else if (imageUrl) {
				resolvedImageUrl = imageUrl;
			} else {
				resolvedImageUrl = existing.productImageUrl || null;
			}

			// Delete old image from storage when replacing or clearing
			if (
				(resolvedImageUrl !== existing.productImageUrl || imageCleared) &&
				existing.productImageUrl
			) {
				await deleteSignedUrl(existing.productImageUrl);
			}

			product = { ...product, productImageUrl: resolvedImageUrl || '', supplierId: 1 };

			await this.db.query.transaction(async (trx) => {
				await trx('product')
					.insert({
						workspaceId,
						ProductId: product.productId,
						CategoryId: product.categoryId,
						SupplierId: product.supplierId,
						ProductName: product.productName,
						ProductInStockQuantity: product.productInStockQuantity,
						ProductUnitSizeInMilliliters: product.productUnitSizeInMilliliters,
						ProductPricePerUnit: product.productPricePerUnit,
						ProductProof: product.productProof,
					})
					.onConflict('ProductId')
					.merge();

				await trx('productdetail')
					.insert({
						ProductId: product.productId,
						ProductImageUrl: product.productImageUrl,
						ProductDescription: product.productDescription,
						ProductSweetnessRating: product.productSweetnessRating,
						ProductDrynessRating: product.productDrynessRating,
						ProductVersatilityRating: product.productVersatilityRating,
						ProductStrengthRating: product.productStrengthRating,
					})
					.onConflict('ProductId')
					.merge();

				await trx.commit();
			});

			const newItem = await this.findById(workspaceId, product.productId!);
			if (!newItem) {
				throw new Error(
					'Inventory was successfully updated, but the subquery returned no results.'
				);
			}

			return { status: 'success', data: newItem };
		} catch (error: any) {
			console.error(error);
			return { status: 'error', error: 'Could not update inventory.' };
		}
	}

	async delete(workspaceId: string, productId: number): Promise<QueryResult<number>> {
		try {
			let productImageUrl: string | undefined;
			let rowsDeleted: number | undefined;

			await this.db.query.transaction(async (trx) => {
				let childRow = await trx('productdetail')
					.select('ProductImageUrl')
					.where('ProductId', productId)
					.first();

				if (childRow?.productImageUrl) {
					productImageUrl = childRow.productImageUrl;
				}

				const rows = await this.db
					.table<Product>('product')
					.where('ProductId', productId)
					.where('workspaceId', workspaceId)
					.del();

				rowsDeleted = rows;
				await trx.commit();
			});

			if (productImageUrl) {
				await deleteSignedUrl(productImageUrl);
			}

			return { status: 'success', data: rowsDeleted || 0 };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not delete inventory item.' };
		}
	}

	async toggleInStockQuantity(
		workspaceId: string,
		productId: number
	): Promise<QueryResult<Product>> {
		try {
			const existing = await this.findById(workspaceId, productId);
			if (!existing) {
				return { status: 'error', error: 'Product not found in this workspace.' };
			}

			const newQuantity = existing.productInStockQuantity ? 0 : 1;

			await this.db
				.table('product')
				.where('ProductId', productId)
				.where('workspaceId', workspaceId)
				.update({ ProductInStockQuantity: newQuantity });

			const updated = await this.findById(workspaceId, productId);
			if (!updated) {
				return { status: 'error', error: 'Failed to retrieve updated product.' };
			}

			return { status: 'success', data: updated };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not toggle stock status.' };
		}
	}

	async getStats(workspaceId: string): Promise<InventoryStats> {
		try {
			const statsResult = await this.db
				.table('inventory')
				.where('workspaceId', workspaceId)
				.select(
					this.db.query.raw('COUNT(*) as total'),
					this.db.query.raw(
						'SUM(CASE WHEN productInStockQuantity > 1 THEN 1 ELSE 0 END) as inStock'
					),
					this.db.query.raw(
						'SUM(CASE WHEN productInStockQuantity = 0 THEN 1 ELSE 0 END) as outOfStock'
					),
					this.db.query.raw(
						'SUM(CASE WHEN productInStockQuantity = 1 THEN 1 ELSE 0 END) as lowStock'
					)
				);

			const stats = statsResult[0] as unknown as
				| { total: number; inStock: number; outOfStock: number; lowStock: number }
				| undefined;
			const breakdown = await this.getCategoryBreakdown(workspaceId);

			return {
				total: Number(stats?.total) || 0,
				inStock: Number(stats?.inStock) || 0,
				outOfStock: Number(stats?.outOfStock) || 0,
				lowStock: Number(stats?.lowStock) || 0,
				categoryBreakdown: breakdown,
			};
		} catch (error: any) {
			console.error('Failed to get inventory stats:', error);
			return { total: 0, inStock: 0, outOfStock: 0, lowStock: 0, categoryBreakdown: [] };
		}
	}

	async getCategoryBreakdown(workspaceId: string): Promise<CategoryCount[]> {
		try {
			const result = await this.db
				.table('inventory')
				.where('workspaceId', workspaceId)
				.select('CategoryId', 'CategoryName')
				.count('* as count')
				.groupBy('CategoryId', 'CategoryName')
				.orderBy('CategoryName');

			return (result as any[]).map((row) => ({
				categoryId: row.categoryId,
				categoryName: row.categoryName,
				count: Number(row.count),
			}));
		} catch (error: any) {
			console.error('Failed to get product categories:', error);
			return [];
		}
	}

	async getRecipeUsage(workspaceId: string, productIds: number[]): Promise<Map<number, number>> {
		try {
			if (productIds.length === 0) return new Map();

			const result = await this.db
				.table('basicrecipestep')
				.select('ProductId')
				.where('workspaceId', workspaceId)
				.count('* as recipeCount')
				.whereIn('ProductId', productIds)
				.groupBy('ProductId');

			const usageMap = new Map<number, number>();
			result.forEach((row: any) => {
				usageMap.set(row.productId, Number(row.recipeCount));
			});

			return usageMap;
		} catch (error: any) {
			console.error('Failed to get recipe usage:', error);
			return new Map();
		}
	}

	// select options for dropdowns
	async getProductOptions(workspaceId: string): Promise<SelectOption[]> {
		try {
			let result = await this.db
				.table('product as p')
				.join('category as c', 'p.CategoryId', 'c.CategoryId')
				.leftJoin('category as pc', 'c.ParentCategoryId', 'pc.CategoryId')
				.where('p.workspaceId', workspaceId)
				.select(
					'p.ProductId',
					'p.ProductName',
					'c.CategoryId',
					'c.CategoryName',
					'c.ParentCategoryId',
					'pc.CategoryName as ParentCategoryName'
				);
			let products = result as any[];
			return products.map(
				({
					productId,
					productName,
					categoryId,
					categoryName,
					parentCategoryId,
					parentCategoryName,
				}) => ({
					name: productName,
					value: productId || 0,
					categoryId,
					categoryName,
					parentCategoryId: parentCategoryId ?? null,
					parentCategoryName: parentCategoryName ?? null,
				})
			);
		} catch (error: any) {
			console.error(error);
			return [];
		}
	}

	async getCategoryOptions(workspaceId: string): Promise<SelectOption[]> {
		try {
			// Only show leaf categories (those that have no children)
			let result = await this.db
				.table('category as c')
				.where('c.workspaceId', workspaceId)
				.whereNotExists(function () {
					this.select('*')
						.from('category as child')
						.whereRaw('child.ParentCategoryId = c.CategoryId');
				})
				.select('c.CategoryId', 'c.CategoryName')
				.orderBy('c.CategoryName');
			let categories = result as Category[];
			return categories.map(({ categoryId, categoryName }) => ({
				name: categoryName,
				value: categoryId,
			}));
		} catch (error: any) {
			console.error(error);
			return [];
		}
	}

	// category CRUD
	async findCategoryById(
		workspaceId: string,
		categoryId: number
	): Promise<QueryResult<Table.Category>> {
		try {
			const dbResult = await this.db
				.table('category')
				.where('categoryId', categoryId)
				.where('workspaceId', workspaceId)
				.first();

			if (!dbResult) throw new Error('No category found for given ID.');
			const category = dbResult as Table.Category;
			return { status: 'success', data: category };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: error?.message || 'An unknown error occurred.' };
		}
	}

	async createCategory(
		workspaceId: string,
		categoryName: string,
		categoryDescription: string | null,
		parentCategoryId: number | null = null
	): Promise<QueryResult<number>> {
		try {
			const [categoryId] = await this.db.table('category').insert({
				workspaceId,
				CategoryName: titleCase(categoryName.trim()),
				CategoryDescription: categoryDescription,
				ParentCategoryId: parentCategoryId,
			});
			return { status: 'success', data: categoryId };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: error?.code || 'An unknown error occurred.' };
		}
	}

	async updateCategory(
		workspaceId: string,
		category: Table.Category
	): Promise<QueryResult<Table.Category>> {
		try {
			let dbResult: any;
			let key = category.categoryId;
			const { categoryName, categoryDescription, parentCategoryId } = category;

			if (!key) {
				[dbResult] = await this.db.table('category').insert({
					workspaceId,
					CategoryName: categoryName,
					CategoryDescription: categoryDescription,
					ParentCategoryId: parentCategoryId,
				});
				if (!dbResult) throw new Error('Could not create new category.');
				key = dbResult;
			} else {
				// verify category belongs to workspace
				const existing = await this.findCategoryById(workspaceId, key);
				if (existing.status === 'error') throw new Error('Category not found in this workspace.');

				dbResult = await this.db
					.table('category')
					.update({
						CategoryName: categoryName,
						CategoryDescription: categoryDescription,
						ParentCategoryId: parentCategoryId,
					})
					.where('categoryId', key)
					.where('workspaceId', workspaceId);
				if (dbResult < 1) {
					throw new Error('Could not update category.');
				}
			}

			dbResult = await this.db
				.table('category')
				.where('categoryId', key)
				.where('workspaceId', workspaceId)
				.select();
			const newCategory = dbResult as Table.Category;

			return { status: 'success', data: newCategory };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: error?.message || 'An unknown error occurred.' };
		}
	}

	async findAllCategories(
		workspaceId: string,
		currentPage: number = 1,
		perPage: number = 10,
		search: string | null = null
	): Promise<PaginationResult<(Category & { productCount: number })[]>> {
		try {
			let query = this.db
				.table('category')
				.where('category.workspaceId', workspaceId)
				.leftJoin('product', function () {
					this.on('category.CategoryId', '=', 'product.CategoryId').andOn(
						'category.workspaceId',
						'=',
						'product.workspaceId'
					);
				})
				.select(
					'category.CategoryId',
					'category.CategoryName',
					'category.CategoryDescription',
					'category.ParentCategoryId',
					this.db.query.raw('COUNT(product.ProductId) as productCount')
				)
				.groupBy(
					'category.CategoryId',
					'category.CategoryName',
					'category.CategoryDescription',
					'category.ParentCategoryId'
				)
				.orderBy('category.CategoryName');

			if (search) {
				query = query.andWhere('category.CategoryName', 'like', `%${search}%`);
			}

			const { data, pagination } = await query.paginate({
				perPage,
				currentPage,
				isLengthAware: true,
			});

			const categories = (data as any[]).map((row) => ({
				categoryId: row.categoryId,
				categoryName: row.categoryName,
				categoryDescription: row.categoryDescription,
				parentCategoryId: row.parentCategoryId,
				productCount: Number(row.productCount),
			}));

			return { data: categories, pagination };
		} catch (error: any) {
			console.error('Failed to get all categories:', error);
			return { data: [], pagination: emptyPagination };
		}
	}

	async findSubcategories(
		workspaceId: string,
		parentCategoryId: number
	): Promise<(Category & { productCount: number })[]> {
		try {
			const result = await this.db
				.table('category')
				.where('category.workspaceId', workspaceId)
				.where('category.ParentCategoryId', parentCategoryId)
				.leftJoin('product', function () {
					this.on('category.CategoryId', '=', 'product.CategoryId').andOn(
						'category.workspaceId',
						'=',
						'product.workspaceId'
					);
				})
				.select(
					'category.CategoryId',
					'category.CategoryName',
					'category.CategoryDescription',
					'category.ParentCategoryId',
					this.db.query.raw('COUNT(product.ProductId) as productCount')
				)
				.groupBy(
					'category.CategoryId',
					'category.CategoryName',
					'category.CategoryDescription',
					'category.ParentCategoryId'
				)
				.orderBy('category.CategoryName');

			return (result as any[]).map((row) => ({
				categoryId: row.categoryId,
				categoryName: row.categoryName,
				categoryDescription: row.categoryDescription,
				parentCategoryId: row.parentCategoryId,
				productCount: Number(row.productCount),
			}));
		} catch (error: any) {
			console.error('Failed to get subcategories:', error);
			return [];
		}
	}

	async findProductsByCategory(workspaceId: string, categoryId: number): Promise<Product[]> {
		try {
			const result = await this.db
				.table('inventory')
				.where('workspaceId', workspaceId)
				.where('categoryId', categoryId)
				.select()
				.orderBy('productName');

			return result as Product[];
		} catch (error: any) {
			console.error('Failed to get products by category:', error);
			return [];
		}
	}

	async deleteCategory(workspaceId: string, categoryId: number): Promise<QueryResult<number>> {
		try {
			// Check if category has products
			const productCountResult = (await this.db
				.table('product')
				.where('CategoryId', categoryId)
				.where('workspaceId', workspaceId)
				.count('* as count')
				.first()) as { count: number } | undefined;

			const productCount = Number(productCountResult?.count) || 0;
			if (productCount > 0) {
				return {
					status: 'error',
					error: `Cannot delete category with ${productCount} product(s). Move or delete the products first.`,
				};
			}

			const rowsDeleted = await this.db
				.table('category')
				.where('CategoryId', categoryId)
				.where('workspaceId', workspaceId)
				.del();

			return { status: 'success', data: rowsDeleted };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not delete category.' };
		}
	}
}
