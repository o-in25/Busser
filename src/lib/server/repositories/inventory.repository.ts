// inventory domain repository
import type {
	Category,
	CategoryGroupCount,
	InventoryStats,
	PaginationResult,
	Product,
	QueryResult,
	SelectOption,
	ShoppingListItem,
	Supplier,
	SupplierType,
	Table,
	CategoryGroup,
} from '$lib/types';
import { emptyPagination } from '$lib/types';
import { titleCase } from '$lib/utils';

import { DbProvider } from '../db';
import { Logger } from '../logger';
import { deleteSignedUrl } from '../storage';
import { getGlobalWorkspace } from '../workspace';
import { BaseRepository } from './base.repository';

export class InventoryRepository extends BaseRepository {
	constructor(db: DbProvider) {
		super(db);
	}

	async findAll(
		workspaceId: string,
		currentPage: number,
		perPage: number = 24,
		filter: (Partial<Product> & { stockFilter?: string }) | null = null,
		sort: string = 'name-asc'
	): Promise<PaginationResult<Product[]>> {
		try {
			let query = this.db.table('inventory').where('workspaceId', workspaceId);

			if (filter?.productName) {
				query = query.andWhere('productName', 'like', `%${filter.productName}%`);
			}

			if (filter?.categoryGroupId) {
				query = query.andWhere('categoryGroupId', '=', filter.categoryGroupId);
			}

			if (filter?.supplierId) {
				query = query.andWhere('supplierId', '=', filter.supplierId);
			}

			if (filter?.stockFilter) {
				if (filter.stockFilter === 'out-of-stock') {
					query = query.andWhere('productInStockQuantity', '=', 0);
				} else if (filter.stockFilter === 'in-stock') {
					query = query.andWhere('productInStockQuantity', '>', 0);
				}
			} else if (typeof filter?.productInStockQuantity !== 'undefined') {
				query = query.andWhere('productInStockQuantity', '=', filter.productInStockQuantity);
			}

			// resolve sort column and direction
			const sortMap: Record<string, { column: string; order: 'asc' | 'desc' }> = {
				'name-asc': { column: 'productName', order: 'asc' },
				'name-desc': { column: 'productName', order: 'desc' },
				newest: { column: 'productId', order: 'desc' },
				oldest: { column: 'productId', order: 'asc' },
			};
			const { column, order } = sortMap[sort] || sortMap['name-asc'];

			const { data, pagination } = await query
				.select()
				.orderBy(column, order)
				.paginate({ perPage, currentPage, isLengthAware: true });

			return { data: data as Product[], pagination };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
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
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
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

				if (product.productInStockQuantity > 0) {
					await trx('workspacestock').insert({
						WorkspaceId: workspaceId,
						ProductId: parentRowId,
						Quantity: product.productInStockQuantity,
					});
				}

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

			// db keeps the global catalog one-row-per-ingredient (ux_product_global_norm)
			if (
				error.code === 'ER_DUP_ENTRY' &&
				String(error.sqlMessage).includes('ux_product_global_norm')
			) {
				return {
					status: 'error',
					error: `A global product named "${product.productName}" already exists.`,
				};
			}
			return { status: 'error', error: 'Could not add new item to inventory.' };
		}
	}

	// owned = editable/deletable; foreign = shared global product this bar only overlays stock on
	private async splitByOwnership(workspaceId: string, productIds: number[]) {
		const rows = (await this.db
			.table('product')
			.whereIn('ProductId', productIds)
			.select('ProductId', 'WorkspaceId')) as Array<{ productId: number; workspaceId: string }>;
		const owned: number[] = [];
		const foreign: number[] = [];
		for (const r of rows) (r.workspaceId === workspaceId ? owned : foreign).push(r.productId);
		return { owned, foreign };
	}

	async isOwned(workspaceId: string, productId: number): Promise<boolean> {
		const { owned } = await this.splitByOwnership(workspaceId, [productId]);
		return owned.length > 0;
	}

	async update(
		workspaceId: string,
		product: Product,
		imageUrl: string = '',
		imageCleared: boolean = false
	): Promise<QueryResult<Product>> {
		try {
			if (!product?.productId) throw Error('No inventory ID provided.');

			const existing = await this.findById(workspaceId, product.productId);
			if (!existing) throw Error('Product not found in this workspace.');

			// shared catalog products are read-only here — only their stock can change (via workspacestock)
			const { owned } = await this.splitByOwnership(workspaceId, [product.productId]);
			if (owned.length === 0) {
				return {
					status: 'error',
					error:
						"This is a shared Busser catalog product — its details can't be edited here. " +
						'You can update its stock, or add your own version as a house product.',
				};
			}

			let resolvedImageUrl: string | null;
			if (imageCleared) {
				resolvedImageUrl = null;
			} else if (imageUrl) {
				resolvedImageUrl = imageUrl;
			} else {
				resolvedImageUrl = existing.productImageUrl || null;
			}

			// delete old image from storage when replacing or clearing
			if (
				(resolvedImageUrl !== existing.productImageUrl || imageCleared) &&
				existing.productImageUrl
			) {
				await deleteSignedUrl(existing.productImageUrl);
			}

			product = { ...product, productImageUrl: resolvedImageUrl || '' };

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

				await trx('workspacestock')
					.insert({
						WorkspaceId: workspaceId,
						ProductId: product.productId,
						Quantity: product.productInStockQuantity,
					})
					.onConflict(['WorkspaceId', 'ProductId'])
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
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not update inventory.' };
		}
	}

	async bulkDelete(
		workspaceId: string,
		productIds: number[]
	): Promise<QueryResult<{ deleted: number }>> {
		try {
			if (productIds.length === 0) {
				return { status: 'success', data: { deleted: 0 } };
			}

			// owned rows get really deleted; foreign (shared global) ones just leave this bar's overlay
			const { owned, foreign } = await this.splitByOwnership(workspaceId, productIds);

			const { imageUrls, deleted } = await this.db.query.transaction(async (trx) => {
				let removed = 0;
				let urls: string[] = [];

				if (owned.length > 0) {
					const detailRows = (await trx('productdetail')
						.select('ProductImageUrl')
						.whereIn('ProductId', owned)) as Array<{ productImageUrl: string | null }>;
					urls = detailRows.map((r) => r.productImageUrl).filter((url): url is string => !!url);

					removed += await trx<Product>('product')
						.whereIn('ProductId', owned)
						.where('workspaceId', workspaceId)
						.del();
				}

				if (foreign.length > 0) {
					removed += await trx('workspacestock')
						.where('WorkspaceId', workspaceId)
						.whereIn('ProductId', foreign)
						.del();
				}

				return { imageUrls: urls, deleted: removed };
			});

			// clean up gcs outside the transaction so we don't hold a db connection during storage
			await Promise.all(imageUrls.map((url) => deleteSignedUrl(url)));

			return { status: 'success', data: { deleted } };
		} catch (error: any) {
			if (error?.code === 'ER_ROW_IS_REFERENCED_2' || error?.errno === 1451) {
				return {
					status: 'error',
					error:
						'One or more of the selected items are used in recipes. Remove them from those recipes first, then try again.',
				};
			}
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not delete inventory items.' };
		}
	}

	async delete(workspaceId: string, productId: number): Promise<QueryResult<number>> {
		try {
			// shared global product — just drop this bar's stock overlay, leave the catalog row alone
			const { owned } = await this.splitByOwnership(workspaceId, [productId]);
			if (owned.length === 0) {
				await this.db
					.table('workspacestock')
					.where({ WorkspaceId: workspaceId, ProductId: productId })
					.del();
				return { status: 'success', data: 1 };
			}

			const { productImageUrl, rowsDeleted } = await this.db.query.transaction(async (trx) => {
				const childRow = await trx('productdetail')
					.select('ProductImageUrl')
					.where('ProductId', productId)
					.first();

				const rows = await trx<Product>('product')
					.where('ProductId', productId)
					.where('workspaceId', workspaceId)
					.del();

				return {
					productImageUrl: childRow?.productImageUrl as string | undefined,
					rowsDeleted: rows,
				};
			});

			if (productImageUrl) {
				await deleteSignedUrl(productImageUrl);
			}

			return { status: 'success', data: rowsDeleted || 0 };
		} catch (error: any) {
			if (error?.code === 'ER_ROW_IS_REFERENCED_2' || error?.errno === 1451) {
				return {
					status: 'error',
					error:
						'This item is used in one or more recipes. Remove it from those recipes first, then try again.',
				};
			}
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not delete inventory item.' };
		}
	}

	async setStockQuantity(
		workspaceId: string,
		productIds: number[],
		quantity: number
	): Promise<QueryResult<number>> {
		try {
			const updated = await this.db.query.transaction(async (trx) => {
				// resolve against the overlay view so global (shared) products count too, not just
				// rows physically owned by this workspace — otherwise bulk no-ops on global products
				const visibleRows = (await trx('inventory')
					.select('ProductId')
					.whereIn('ProductId', productIds)
					.where('workspaceId', workspaceId)) as Array<{ productId: number }>;
				const visibleIds = visibleRows.map((r) => r.productId);

				if (visibleIds.length === 0) return 0;

				// dual-write: keep owned product rows in sync (global rows are immutable, so this no-ops them)
				await trx('product')
					.whereIn('ProductId', visibleIds)
					.where('workspaceId', workspaceId)
					.update({ ProductInStockQuantity: quantity });

				// authoritative overlay stock
				await trx('workspacestock')
					.insert(
						visibleIds.map((ProductId) => ({
							WorkspaceId: workspaceId,
							ProductId,
							Quantity: quantity,
						}))
					)
					.onConflict(['WorkspaceId', 'ProductId'])
					.merge();

				return visibleIds.length;
			});
			return { status: 'success', data: updated };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not update stock status.' };
		}
	}

	// stock an existing global product onto the overlay (setStockQuantity can't — it no-ops a
	// global product the bar doesn't stock yet)
	async stockFromGlobal(
		workspaceId: string,
		productId: number,
		quantity: number
	): Promise<QueryResult<number>> {
		try {
			const globalId = getGlobalWorkspace();
			const workspaces = workspaceId === globalId ? [globalId] : [workspaceId, globalId];
			const product = await this.db
				.table('product')
				.where('ProductId', productId)
				.whereIn('WorkspaceId', workspaces)
				.where('Retired', false)
				.first();
			if (!product) {
				return { status: 'error', error: 'That product is not in the catalog.' };
			}

			await this.db
				.table('workspacestock')
				.insert({ WorkspaceId: workspaceId, ProductId: productId, Quantity: quantity })
				.onConflict(['WorkspaceId', 'ProductId'])
				.merge();

			return { status: 'success', data: productId };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not add product to inventory.' };
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

			await this.db.query.transaction(async (trx) => {
				await trx('product')
					.where('ProductId', productId)
					.where('workspaceId', workspaceId)
					.update({ ProductInStockQuantity: newQuantity });

				await trx('workspacestock')
					.insert({ WorkspaceId: workspaceId, ProductId: productId, Quantity: newQuantity })
					.onConflict(['WorkspaceId', 'ProductId'])
					.merge();
			});

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

	// give a new bar its baseline pantry
	async seedInventory(workspaceId: string): Promise<void> {
		try {
			const globalId = getGlobalWorkspace();
			const rows = (await this.db
				.table('product as p')
				.join('supplier as s', 'p.SupplierId', 's.SupplierId')
				.join('suppliertype as st', 's.SupplierTypeId', 'st.SupplierTypeId')
				.where('p.WorkspaceId', globalId)
				.where('st.SupplierTypeName', 'homemade')
				.select('p.ProductId')) as Array<{ productId: number }>;
			if (rows.length === 0) return;

			await this.db
				.table('workspacestock')
				.insert(
					rows.map((r) => ({ WorkspaceId: workspaceId, ProductId: r.productId, Quantity: 0 }))
				)
				.onConflict(['WorkspaceId', 'ProductId'])
				.ignore();
		} catch (error: any) {
			// don't block workspace creation on error
			console.error('Failed to seed baseline inventory:', error.message);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
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
						'SUM(CASE WHEN productInStockQuantity > 0 THEN 1 ELSE 0 END) as inStock'
					),
					this.db.query.raw(
						'SUM(CASE WHEN productInStockQuantity = 0 THEN 1 ELSE 0 END) as outOfStock'
					)
				);

			const stats = statsResult[0] as unknown as
				| { total: number; inStock: number; outOfStock: number }
				| undefined;
			const breakdown = await this.getCategoryBreakdown(workspaceId);

			return {
				total: Number(stats?.total) || 0,
				inStock: Number(stats?.inStock) || 0,
				outOfStock: Number(stats?.outOfStock) || 0,
				categoryBreakdown: breakdown,
			};
		} catch (error: any) {
			console.error('Failed to get inventory stats:', error);
			Logger.error(
				`Failed to get inventory stats: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return { total: 0, inStock: 0, outOfStock: 0, categoryBreakdown: [] };
		}
	}

	async getCategoryBreakdown(workspaceId: string): Promise<CategoryGroupCount[]> {
		try {
			const result = await this.db
				.table('inventory')
				.where('workspaceId', workspaceId)
				.whereNotNull('CategoryGroupId')
				.select('CategoryGroupId', 'CategoryGroupName')
				.count('* as count')
				.groupBy('CategoryGroupId', 'CategoryGroupName')
				.orderBy('CategoryGroupName');

			return (result as any[]).map((row) => ({
				categoryGroupId: row.categoryGroupId,
				categoryGroupName: row.categoryGroupName,
				count: Number(row.count),
			}));
		} catch (error: any) {
			console.error('Failed to get category groups:', error);
			Logger.error(
				`Failed to get category groups: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
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
			Logger.error(
				`Failed to get recipe usage: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return new Map();
		}
	}

	async getProductOptions(workspaceId: string): Promise<SelectOption[]> {
		try {
			const globalId = getGlobalWorkspace();
			const workspaces = workspaceId === globalId ? [globalId] : [workspaceId, globalId];
			const result = (await this.db
				.table('product as p')
				.join('category as c', 'p.CategoryId', 'c.CategoryId')
				.leftJoin('category as pc', 'c.ParentCategoryId', 'pc.CategoryId')
				.whereIn('p.WorkspaceId', workspaces)
				.where('p.Retired', false)
				.select(
					'p.ProductId',
					'p.ProductName',
					'p.WorkspaceId',
					'c.CategoryId',
					'c.CategoryName',
					'c.ParentCategoryId',
					'pc.CategoryName as ParentCategoryName'
				)) as any[];

			const byName = new Map<string, any>();
			for (const r of result) {
				const key = (r.productName || '').trim().toLowerCase();
				const existing = byName.get(key);
				if (!existing || r.workspaceId === globalId) byName.set(key, r);
			}

			return [...byName.values()].map((r) => ({
				name: r.productName,
				value: r.productId || 0,
				categoryId: r.categoryId,
				categoryName: r.categoryName,
				parentCategoryId: r.parentCategoryId ?? null,
				parentCategoryName: r.parentCategoryName ?? null,
			}));
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return [];
		}
	}

	async getCategoryOptions(workspaceId: string): Promise<SelectOption[]> {
		try {
			const globalId = getGlobalWorkspace();
			const workspaces = workspaceId === globalId ? [globalId] : [workspaceId, globalId];
			const result = (await this.db
				.table('category as c')
				.whereIn('c.WorkspaceId', workspaces)
				.select('c.CategoryId', 'c.CategoryName', 'c.CategoryGroupId', 'c.WorkspaceId')
				.orderBy('c.CategoryName')) as any[];

			const byName = new Map<string, any>();
			for (const r of result) {
				const key = (r.categoryName || '').toLowerCase();
				const existing = byName.get(key);
				if (!existing || r.workspaceId === globalId) byName.set(key, r);
			}

			return [...byName.values()].map((r) => ({
				name: r.categoryName,
				value: r.categoryId,
				categoryGroupId: r.categoryGroupId ?? null,
			}));
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return [];
		}
	}

	async getCategoryGroupOptions(): Promise<SelectOption[]> {
		try {
			const result = await this.db
				.table('categorygroup')
				.select('CategoryGroupId', 'CategoryGroupName')
				.orderBy('CategoryGroupName');
			return (result as CategoryGroup[]).map(({ categoryGroupId, categoryGroupName }) => ({
				name: categoryGroupName,
				value: categoryGroupId,
			}));
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
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
				.select(
					'CategoryId',
					'CategoryName',
					'CategoryDescription',
					'ParentCategoryId',
					'CategoryGroupId'
				)
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
		parentCategoryId: number | null = null,
		categoryGroupId: number | null = null
	): Promise<QueryResult<number>> {
		try {
			// auto inherits group from parent when not explicitly set
			if (parentCategoryId && !categoryGroupId) {
				const parent = await this.db
					.table('category')
					.where({ CategoryId: parentCategoryId, workspaceId })
					.select('CategoryGroupId')
					.first();
				if (parent?.categoryGroupId) categoryGroupId = parent.categoryGroupId;
			}

			const [categoryId] = await this.db.table('category').insert({
				workspaceId,
				CategoryName: titleCase(categoryName.trim()),
				CategoryDescription: categoryDescription,
				ParentCategoryId: parentCategoryId,
				CategoryGroupId: categoryGroupId,
			});
			return { status: 'success', data: categoryId };
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);

			if (error.code === 'ER_DUP_ENTRY') {
				return { status: 'error', error: 'A category with this name already exists.' };
			}
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
			let { categoryGroupId } = category;

			// auto inherits group from parent when not explicitly set
			if (parentCategoryId && !categoryGroupId) {
				const parent = await this.db
					.table('category')
					.where({ CategoryId: parentCategoryId, workspaceId })
					.select('CategoryGroupId')
					.first();
				if (parent?.categoryGroupId) categoryGroupId = parent.categoryGroupId;
			}

			if (!key) {
				[dbResult] = await this.db.table('category').insert({
					workspaceId,
					CategoryName: categoryName,
					CategoryDescription: categoryDescription,
					ParentCategoryId: parentCategoryId,
					CategoryGroupId: categoryGroupId || null,
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
						CategoryGroupId: categoryGroupId || null,
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
		perPage: number = 24,
		search: string | null = null
	): Promise<
		PaginationResult<(Category & { productCount: number; categoryGroupName: string | null })[]>
	> {
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
				.leftJoin('categorygroup', 'category.CategoryGroupId', 'categorygroup.CategoryGroupId')
				.select(
					'category.CategoryId',
					'category.CategoryName',
					'category.CategoryDescription',
					'category.ParentCategoryId',
					'category.CategoryGroupId',
					'categorygroup.CategoryGroupName',
					this.db.query.raw('COUNT(product.ProductId) as productCount')
				)
				.groupBy(
					'category.CategoryId',
					'category.CategoryName',
					'category.CategoryDescription',
					'category.ParentCategoryId',
					'category.CategoryGroupId',
					'categorygroup.CategoryGroupName'
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
				categoryGroupId: row.categoryGroupId ?? null,
				categoryGroupName: row.categoryGroupName ?? null,
				productCount: Number(row.productCount),
			}));

			return { data: categories, pagination };
		} catch (error: any) {
			console.error('Failed to get all categories:', error);
			Logger.error(
				`Failed to get all categories: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
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
					'category.CategoryGroupId',
					this.db.query.raw('COUNT(product.ProductId) as productCount')
				)
				.groupBy(
					'category.CategoryId',
					'category.CategoryName',
					'category.CategoryDescription',
					'category.ParentCategoryId',
					'category.CategoryGroupId'
				)
				.orderBy('category.CategoryName');

			return (result as any[]).map((row) => ({
				categoryId: row.categoryId,
				categoryName: row.categoryName,
				categoryDescription: row.categoryDescription,
				parentCategoryId: row.parentCategoryId,
				categoryGroupId: row.categoryGroupId ?? null,
				productCount: Number(row.productCount),
			}));
		} catch (error: any) {
			console.error('Failed to get subcategories:', error);
			Logger.error(
				`Failed to get subcategories: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
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
			Logger.error(
				`Failed to get products by category: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return [];
		}
	}

	// get out of stock items with supplier info and recipe count
	async getShoppingList(
		workspaceId: string,
		currentPage: number = 1,
		perPage: number = 20,
		filter: { productName?: string; categoryGroupId?: number; supplierId?: number } | null = null,
		sort: string = 'name-asc'
	): Promise<PaginationResult<ShoppingListItem[]>> {
		try {
			let query = this.db
				.table('inventory as i')
				.leftJoin('basicrecipestep as rs', function () {
					this.on('i.ProductId', '=', 'rs.ProductId').andOn('i.WorkspaceId', '=', 'rs.WorkspaceId');
				})
				.where('i.WorkspaceId', workspaceId)
				.where('i.ProductInStockQuantity', 0);

			if (filter?.productName) {
				query = query.andWhere('i.ProductName', 'like', `%${filter.productName}%`);
			}
			if (filter?.categoryGroupId) {
				query = query.andWhere('i.CategoryGroupId', '=', filter.categoryGroupId);
			}
			if (filter?.supplierId) {
				query = query.andWhere('i.SupplierId', '=', filter.supplierId);
			}

			const sortMap: Record<string, { column: string; order: 'asc' | 'desc' }> = {
				'name-asc': { column: 'i.ProductName', order: 'asc' },
				'name-desc': { column: 'i.ProductName', order: 'desc' },
				'price-asc': { column: 'i.ProductPricePerUnit', order: 'asc' },
				'price-desc': { column: 'i.ProductPricePerUnit', order: 'desc' },
			};
			const { column, order } = sortMap[sort] || sortMap['name-asc'];

			query = (query as any)
				.select(
					'i.ProductId',
					'i.ProductName',
					'i.ProductImageUrl',
					'i.ProductPricePerUnit',
					'i.ProductUnitSizeInMilliliters',
					'i.CategoryName',
					'i.CategoryGroupName',
					'i.CategoryGroupId',
					'i.SupplierId',
					'i.SupplierName'
				)
				.count('rs.RecipeStepId as recipeCount')
				.groupBy(
					'i.ProductId',
					'i.ProductName',
					'i.ProductImageUrl',
					'i.ProductPricePerUnit',
					'i.ProductUnitSizeInMilliliters',
					'i.CategoryName',
					'i.CategoryGroupName',
					'i.CategoryGroupId',
					'i.SupplierId',
					'i.SupplierName'
				)
				.orderBy(column, order);

			const { data, pagination } = await query.paginate({
				perPage,
				currentPage,
				isLengthAware: true,
			});

			const items: ShoppingListItem[] = (data as any[]).map((row) => ({
				productId: row.productId,
				productName: row.productName,
				productImageUrl: row.productImageUrl || '',
				productPricePerUnit: Number(row.productPricePerUnit) || 0,
				productUnitSizeInMilliliters: Number(row.productUnitSizeInMilliliters) || 0,
				categoryName: row.categoryName,
				categoryGroupName: row.categoryGroupName || null,
				supplierId: row.supplierId,
				supplierName: row.supplierName || null,
				recipeCount: Number(row.recipeCount) || 0,
				unlockableRecipes: 0,
				impactScore: 0,
			}));

			return { data: items, pagination };
		} catch (error: any) {
			console.error('Failed to get shopping list:', error);
			Logger.error(
				`Failed to get shopping list: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return { data: [], pagination: emptyPagination };
		}
	}

	// total cost of all out-of-stock items (unfiltered, for summary)
	async getShoppingListTotals(
		workspaceId: string
	): Promise<{ totalCost: number; totalItems: number }> {
		try {
			const result = await this.db
				.table('inventory')
				.where('WorkspaceId', workspaceId)
				.where('ProductInStockQuantity', 0)
				.select(
					this.db.query.raw('COALESCE(SUM(ProductPricePerUnit), 0) as totalCost'),
					this.db.query.raw('COUNT(*) as totalItems')
				)
				.first();

			return {
				totalCost: Number((result as any)?.totalCost) || 0,
				totalItems: Number((result as any)?.totalItems) || 0,
			};
		} catch (error: any) {
			console.error('Failed to get shopping list totals:', error);
			Logger.error(
				`Failed to get shopping list totals: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return { totalCost: 0, totalItems: 0 };
		}
	}

	// find products that are 1 away from stocking a recipe
	async getShoppingListImpact(
		workspaceId: string,
		productIds: number[]
	): Promise<Map<number, number>> {
		try {
			if (productIds.length === 0) return new Map();
			const result = await this.db
				.table('basicrecipestep as rs')
				.join('recipestepstock as ss', 'rs.RecipeStepId', 'ss.RecipeStepId')
				.select('rs.ProductId')
				.select(this.db.query.raw('COUNT(DISTINCT rs.RecipeId) as unlockable'))
				.where('ss.WorkspaceId', workspaceId)
				.where('ss.EffectiveInStock', 0)
				.whereIn('rs.ProductId', productIds)
				.whereIn('rs.RecipeId', function () {
					this.select('RecipeId')
						.from('recipestepstock')
						.where('WorkspaceId', workspaceId)
						.groupBy('RecipeId')
						.havingRaw('SUM(CASE WHEN EffectiveInStock = 0 THEN 1 ELSE 0 END) = 1')
						.havingRaw('COUNT(RecipeStepId) > 1');
				})
				.groupBy('rs.ProductId');

			const map = new Map<number, number>();
			(result as any[]).forEach((row) => {
				map.set(row.productId, Number(row.unlockable));
			});
			return map;
		} catch (error: any) {
			console.error('Failed to get shopping list impact:', error);
			Logger.error(
				`Failed to get shopping list impact: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return new Map();
		}
	}

	// supplier CRUD
	async getSuppliers(workspaceId: string, includeDefault = false): Promise<Supplier[]> {
		try {
			const globalId = getGlobalWorkspace();
			// global suppliers (NULL or the global workspace) are shared to everyone
			let query = this.db.table('supplier as s').where(function () {
				this.whereNull('s.WorkspaceId').orWhereIn('s.WorkspaceId', [globalId, workspaceId]);
			});

			if (!includeDefault) {
				query = query.where('s.SupplierIsDefault', false);
			}

			const result = await query
				.leftJoin('suppliertype as st', 's.SupplierTypeId', 'st.SupplierTypeId')
				.select(
					's.SupplierId',
					's.SupplierName',
					's.SupplierDetails',
					's.SupplierWebsiteUrl',
					's.SupplierPhone',
					's.SupplierAddress',
					's.SupplierPlaceId',
					's.SupplierTypeId',
					's.SupplierIsDefault',
					's.WorkspaceId',
					'st.SupplierTypeName'
				)
				.orderBy('s.SupplierName');

			// flag ownership so the ui can gate edit/remove — globals are view-only
			return (result as any[]).map(({ workspaceId: ownerId, supplierIsDefault, ...rest }) => ({
				...rest,
				supplierIsDefault: Boolean(supplierIsDefault),
				supplierIsOwned: ownerId != null && ownerId === workspaceId,
			})) as Supplier[];
		} catch (error: any) {
			console.error('Failed to get suppliers:', error);
			Logger.error(
				`Failed to get suppliers: ${error.sqlMessage || error.message}`,
				error.sql || error.stackTrace
			);
			return [];
		}
	}

	// single workspace-owned supplier (global suppliers are view-only, so excluded)
	async getSupplierById(workspaceId: string, supplierId: number): Promise<Supplier | null> {
		try {
			const row = await this.db
				.table('supplier as s')
				.where('s.SupplierId', supplierId)
				.where('s.WorkspaceId', workspaceId)
				.leftJoin('suppliertype as st', 's.SupplierTypeId', 'st.SupplierTypeId')
				.select(
					's.SupplierId',
					's.SupplierName',
					's.SupplierDetails',
					's.SupplierWebsiteUrl',
					's.SupplierPhone',
					's.SupplierAddress',
					's.SupplierPlaceId',
					's.SupplierTypeId',
					'st.SupplierTypeName'
				)
				.first();

			return (row as Supplier) || null;
		} catch (error: any) {
			console.error('Failed to get supplier:', error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return null;
		}
	}

	// count of all products assigned to each supplier in the workspace (no stock filter)
	async getSupplierProductCounts(workspaceId: string): Promise<Record<number, number>> {
		try {
			const rows = await this.db
				.table('product')
				.where('workspaceId', workspaceId)
				.whereNotNull('SupplierId')
				.select('SupplierId')
				.count('ProductId as productCount')
				.groupBy('SupplierId');

			const counts: Record<number, number> = {};
			for (const row of rows as any[]) {
				counts[Number(row.supplierId)] = Number(row.productCount);
			}
			return counts;
		} catch (error: any) {
			console.error('Failed to get supplier product counts:', error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return {};
		}
	}

	async getSupplierTypes(): Promise<SelectOption[]> {
		try {
			const result = await this.db
				.table('suppliertype')
				.select('SupplierTypeId', 'SupplierTypeName')
				.orderBy('SupplierTypeName');
			return (result as SupplierType[]).map(({ supplierTypeId, supplierTypeName }) => ({
				name: supplierTypeName,
				value: supplierTypeId,
			}));
		} catch (error: any) {
			console.error(error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return [];
		}
	}

	async getSupplierTypeIdByName(name: string): Promise<number | null> {
		const row = await this.db.table('suppliertype').where('SupplierTypeName', name).first();
		return row ? (row as SupplierType).supplierTypeId : null;
	}

	// the catch-all supplier orphaned products fall back to when their supplier is deleted
	async getDefaultSupplierId(): Promise<number> {
		const row = await this.db.table('supplier').where('SupplierIsDefault', true).first();
		return row ? (row as Supplier).supplierId : 1;
	}

	async createSupplier(
		workspaceId: string,
		supplier: Partial<Supplier>
	): Promise<QueryResult<Supplier>> {
		try {
			// dedup by placeId if provided
			if (supplier.supplierPlaceId) {
				const existing = await this.db
					.table('supplier')
					.where('SupplierPlaceId', supplier.supplierPlaceId)
					.where(function () {
						this.whereNull('WorkspaceId').orWhere('WorkspaceId', workspaceId);
					})
					.first();

				if (existing) {
					return { status: 'success', data: existing as Supplier };
				}
			}

			const [supplierId] = await this.db.table('supplier').insert({
				SupplierName: supplier.supplierName,
				SupplierDetails: supplier.supplierDetails || null,
				SupplierWebsiteUrl: supplier.supplierWebsiteUrl || null,
				SupplierPhone: supplier.supplierPhone || null,
				SupplierAddress: supplier.supplierAddress || null,
				SupplierPlaceId: supplier.supplierPlaceId || null,
				SupplierTypeId: supplier.supplierTypeId || null,
				WorkspaceId: workspaceId,
			});

			const created = await this.db.table('supplier').where('SupplierId', supplierId).first();

			return { status: 'success', data: created as Supplier };
		} catch (error: any) {
			console.error('Failed to create supplier:', error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not create supplier.' };
		}
	}

	async updateSupplier(
		workspaceId: string,
		supplierId: number,
		patch: Partial<Supplier>
	): Promise<QueryResult<Supplier>> {
		try {
			// the default "Any" supplier is immutable
			const target = await this.db.table('supplier').where('SupplierId', supplierId).first();
			if ((target as Supplier | undefined)?.supplierIsDefault) {
				return { status: 'error', error: 'Cannot edit the default supplier.' };
			}

			// only touch columns that were provided
			const fields: Record<string, unknown> = {};
			if (patch.supplierName !== undefined) fields.SupplierName = patch.supplierName;
			if (patch.supplierDetails !== undefined) fields.SupplierDetails = patch.supplierDetails;
			if (patch.supplierWebsiteUrl !== undefined)
				fields.SupplierWebsiteUrl = patch.supplierWebsiteUrl;
			if (patch.supplierPhone !== undefined) fields.SupplierPhone = patch.supplierPhone;
			if (patch.supplierAddress !== undefined) fields.SupplierAddress = patch.supplierAddress;
			if (patch.supplierTypeId !== undefined) fields.SupplierTypeId = patch.supplierTypeId;

			if (Object.keys(fields).length === 0) {
				return { status: 'error', error: 'No fields to update.' };
			}

			// scope to the workspace so global (WorkspaceId NULL) suppliers stay read-only
			const updated = await this.db
				.table('supplier')
				.where('SupplierId', supplierId)
				.where('WorkspaceId', workspaceId)
				.update(fields);

			if (updated === 0) {
				return { status: 'error', error: 'Supplier not found in this workspace.' };
			}

			const row = await this.db.table('supplier').where('SupplierId', supplierId).first();
			return { status: 'success', data: row as Supplier };
		} catch (error: any) {
			console.error('Failed to update supplier:', error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not update supplier.' };
		}
	}

	async deleteSupplier(workspaceId: string, supplierId: number): Promise<QueryResult<number>> {
		try {
			// prevent deleting the default catch-all supplier
			const target = await this.db.table('supplier').where('SupplierId', supplierId).first();
			if ((target as Supplier | undefined)?.supplierIsDefault) {
				return { status: 'error', error: 'Cannot delete the default supplier.' };
			}

			// reassign products to the default before deleting (FK is NO ACTION)
			const defaultSupplierId = await this.getDefaultSupplierId();
			await this.db
				.table('product')
				.where('SupplierId', supplierId)
				.where('WorkspaceId', workspaceId)
				.update({ SupplierId: defaultSupplierId });

			const deleted = await this.db
				.table('supplier')
				.where('SupplierId', supplierId)
				.where('WorkspaceId', workspaceId)
				.del();

			return { status: 'success', data: deleted };
		} catch (error: any) {
			console.error('Failed to delete supplier:', error);
			Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
			return { status: 'error', error: 'Could not delete supplier.' };
		}
	}

	async deleteCategory(workspaceId: string, categoryId: number): Promise<QueryResult<number>> {
		try {
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
