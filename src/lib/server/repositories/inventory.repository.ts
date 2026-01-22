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
import { deleteSignedUrl, getSignedUrl } from '../storage';
import { Logger } from '../logger';
import {
  BaseRepository,
  marshal,
  marshalToType,
  pascalCase,
  camelCase,
  titleCase,
  emptyPagination,
} from './base.repository';

export class InventoryRepository extends BaseRepository {
  constructor(db: DbProvider) {
    super(db);
  }

  async findAll(
    currentPage: number,
    perPage: number = 25,
    filter: Partial<Product> & { stockFilter?: string } | null = null
  ): Promise<PaginationResult<Product[]>> {
    try {
      let query = this.db.table('inventory');

      if (filter?.productName) {
        query = query.where('productName', 'like', `%${filter.productName}%`);
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

      let { data, pagination } = await query
        .select()
        .orderBy('productName')
        .paginate({ perPage, currentPage, isLengthAware: true });

      data = data.map((item) => Object.assign({}, item));
      data = marshal(data);

      return { data: data as Product[], pagination };
    } catch (error: any) {
      console.error(error);
      return { data: [], pagination: emptyPagination };
    }
  }

  async findById(productId: number): Promise<Product | null> {
    try {
      let data = await this.db
        .table<Product>('inventory')
        .where('ProductId', productId)
        .select();

      let result: Product[] = marshal<Product[]>(data);
      if (result.length === 0) {
        throw Error('Product not found');
      }

      return result[0];
    } catch (error: any) {
      console.error(error);
      return null;
    }
  }

  async create(product: Product, image: File | null = null): Promise<QueryResult<Product>> {
    try {
      let parentRowId: number | undefined;
      let childRowId: number | undefined;

      await this.db.query.transaction(async (trx) => {
        const [parentRow] = await trx('product').insert({
          CategoryId: product.categoryId,
          SupplierId: product.supplierId,
          ProductName: product.productName,
          ProductInStockQuantity: product.productInStockQuantity,
          ProductUnitSizeInMilliliters: product.productUnitSizeInMilliliters,
          ProductPricePerUnit: product.productPricePerUnit,
          ProductProof: product.productProof,
        });
        parentRowId = parentRow;

        const productImageUrl = await this.getImageUrl(image);
        const [childRow] = await trx('productdetail')
          .insert({
            ProductId: parentRowId,
            ProductImageUrl: productImageUrl,
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

      const newRow = await this.findById(parentRowId);
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

  async update(product: Product, image: File | null = null): Promise<QueryResult<Product>> {
    try {
      if (!product?.productId) throw Error('No inventory ID provided.');

      const signedUrl = await this.getExistingOrNewImageUrl(product.productId, image);
      product = { ...product, productImageUrl: signedUrl, supplierId: 1 };
      const values = marshal<any>(product, pascalCase);

      await this.db.query.transaction(async (trx) => {
        await trx('product')
          .insert({
            ProductId: values.ProductId,
            CategoryId: values.CategoryId,
            SupplierId: values.SupplierId,
            ProductName: values.ProductName,
            ProductInStockQuantity: values.ProductInStockQuantity,
            ProductUnitSizeInMilliliters: values.ProductUnitSizeInMilliliters,
            ProductPricePerUnit: values.ProductPricePerUnit,
            ProductProof: values.ProductProof,
          })
          .onConflict('ProductId')
          .merge();

        await trx('productdetail')
          .insert({
            ProductId: values.ProductId,
            ProductImageUrl: values.ProductImageUrl,
            ProductDescription: values.ProductDescription,
            ProductSweetnessRating: values.ProductSweetnessRating,
            ProductDrynessRating: values.ProductDrynessRating,
            ProductVersatilityRating: values.ProductVersatilityRating,
            ProductStrengthRating: values.ProductStrengthRating,
          })
          .onConflict('ProductId')
          .merge();

        await trx.commit();
      });

      const newItem = await this.findById(values.ProductId);
      if (!newItem) {
        throw new Error('Inventory was successfully updated, but the subquery returned no results.');
      }

      return { status: 'success', data: newItem };
    } catch (error: any) {
      console.error(error);
      return { status: 'error', error: 'Could not update inventory.' };
    }
  }

  async delete(productId: number): Promise<QueryResult<number>> {
    try {
      let productImageUrl: string | undefined;
      let rowsDeleted: number | undefined;

      await this.db.query.transaction(async (trx) => {
        let childRow = await trx('productdetail')
          .select('ProductImageUrl')
          .where('ProductId', productId)
          .first();

        childRow = marshal(childRow, camelCase);
        if (childRow?.productImageUrl) {
          productImageUrl = childRow.productImageUrl;
        }

        const rows = await this.db
          .table<Product>('product')
          .where('ProductId', productId)
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

  async getStats(): Promise<InventoryStats> {
    try {
      const statsResult = await this.db
        .table('inventory')
        .select(
          this.db.query.raw('COUNT(*) as total'),
          this.db.query.raw('SUM(CASE WHEN productInStockQuantity > 1 THEN 1 ELSE 0 END) as inStock'),
          this.db.query.raw('SUM(CASE WHEN productInStockQuantity = 0 THEN 1 ELSE 0 END) as outOfStock'),
          this.db.query.raw('SUM(CASE WHEN productInStockQuantity = 1 THEN 1 ELSE 0 END) as lowStock')
        );

      const stats = (statsResult[0] as unknown) as { total: number; inStock: number; outOfStock: number; lowStock: number } | undefined;
      const breakdown = await this.getCategoryBreakdown();

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

  async getCategoryBreakdown(): Promise<CategoryCount[]> {
    try {
      const result = await this.db
        .table('inventory')
        .select('CategoryId', 'CategoryName')
        .count('* as count')
        .groupBy('CategoryId', 'CategoryName')
        .orderBy('CategoryName');

      return (result as any[]).map((row) => ({
        categoryId: row.CategoryId,
        categoryName: row.CategoryName,
        count: Number(row.count),
      }));
    } catch (error: any) {
      console.error('Failed to get product categories:', error);
      return [];
    }
  }

  async getRecipeUsage(productIds: number[]): Promise<Map<number, number>> {
    try {
      if (productIds.length === 0) return new Map();

      const result = await this.db
        .table('basicrecipestep')
        .select('ProductId')
        .count('* as recipeCount')
        .whereIn('ProductId', productIds)
        .groupBy('ProductId');

      const usageMap = new Map<number, number>();
      result.forEach((row: any) => {
        usageMap.set(row.ProductId, Number(row.recipeCount));
      });

      return usageMap;
    } catch (error: any) {
      console.error('Failed to get recipe usage:', error);
      return new Map();
    }
  }

  // select options for dropdowns
  async getProductOptions(): Promise<SelectOption[]> {
    try {
      let result = await this.db.table('product').select('ProductId', 'ProductName');
      let products: Product[] = marshal<Product[]>(result);
      return products.map(({ productId, productName }) => ({
        name: productName,
        value: productId || 0,
      }));
    } catch (error: any) {
      console.error(error);
      return [];
    }
  }

  async getCategoryOptions(): Promise<SelectOption[]> {
    try {
      let result = await this.db.table('category').select('CategoryId', 'CategoryName');
      let categories: Category[] = marshal<Category[]>(result);
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
  async findCategoryById(categoryId: number): Promise<QueryResult<Table.Category>> {
    try {
      const dbResult = await this.db
        .table<Table.Category>('category')
        .where({ categoryId })
        .first();

      if (!dbResult) throw new Error('No category found for given ID.');
      const category = marshalToType<Table.Category>(dbResult);
      return { status: 'success', data: category };
    } catch (error: any) {
      console.error(error);
      Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
      return { status: 'error', error: error?.message || 'An unknown error occurred.' };
    }
  }

  async createCategory(categoryName: string, categoryDescription: string | null): Promise<QueryResult<number>> {
    try {
      let newCategory: any = {
        categoryName: titleCase(categoryName.trim()),
        categoryDescription,
      };
      newCategory = marshal(newCategory, pascalCase);

      const [categoryId] = await this.db.table<Table.Category>('category').insert(newCategory);
      return { status: 'success', data: categoryId };
    } catch (error: any) {
      console.error(error);
      Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
      return { status: 'error', error: error?.code || 'An unknown error occurred.' };
    }
  }

  async updateCategory(category: Table.Category): Promise<QueryResult<Table.Category>> {
    try {
      let dbResult: any;
      let key = category.categoryId;
      const { categoryName, categoryDescription } = category;

      if (!key) {
        [dbResult] = await this.db.table<Table.Category>('category').insert({ categoryName, categoryDescription });
        if (!dbResult) throw new Error('Could not create new category.');
        key = dbResult;
      } else {
        dbResult = await this.db
          .table<Table.Category>('category')
          .update({ categoryName, categoryDescription })
          .where('categoryId', key);
        if (dbResult < 1) {
          throw new Error('Could not update category.');
        }
      }

      dbResult = await this.db.table<Table.Category>('category').where('categoryId', key).select();
      const newCategory = marshalToType<Table.Category>(dbResult);

      return { status: 'success', data: newCategory };
    } catch (error: any) {
      console.error(error);
      Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
      return { status: 'error', error: error?.message || 'An unknown error occurred.' };
    }
  }

  // private helpers
  private async getImageUrl(image: File | null): Promise<string | null> {
    if (!image || image.size === 0 || image.name === 'undefined') return null;
    const signedUrl = await getSignedUrl(image);
    return signedUrl.length ? signedUrl : null;
  }

  private async getExistingOrNewImageUrl(productId: number, image: File | null): Promise<string> {
    let oldImage: any = await this.db
      .table('productdetail')
      .select('ProductImageUrl')
      .where({ ProductId: productId })
      .limit(1);

    [oldImage] = marshal(oldImage, camelCase);
    const existingUrl = oldImage?.productImageUrl || null;

    if (!image || image.size === 0 || image.name === 'undefined') {
      return existingUrl;
    }

    const signedUrl = await getSignedUrl(image);
    return signedUrl || existingUrl;
  }
}
