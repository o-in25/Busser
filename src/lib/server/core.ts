
import type { BasicRecipe, Category, FormSubmitResult, GallerySeeding, PaginationResult, Product, ProductDetail, QueryResult, SelectOption, Spirit } from "$lib/types";
import { DbProvider } from "./db";
import _ from 'lodash';
import * as changeCase from "change-case";
import { deleteSignedUrl, getSignedUrl } from "./storage";
import { Logger } from "./logger";

const db = new DbProvider('app_t');

const marshal = <T>(obj: any, fn: Function = camelCase) => {
  if(!_.isObject(obj)) return obj as T;
  if(_.isArray(obj)) return obj.map((v) => marshal<T>(v));
  return _.reduce(obj, (arr, curr, acc) => {
    return {
      ...arr,
      [fn(acc)]: marshal<T>(curr)
    };
  }, {});
};

const pascalCase = (str: string) => changeCase.pascalCase(str)
const camelCase = (str: string) => changeCase.camelCase(str)

const paginationData = {
  total: 0,
  currentPage: 0,
  perPage: 0,
  from: 0,
  to: 0,
  lastPage: 0,
  prevPage: 0,
  nextPage: 0
}

export async function getInventory(currentPage: number, perPage: number = 25): Promise<PaginationResult<Product[]>> {
  try {
    let { data, pagination } = await db.table('inventory')
      .select()
      .paginate({ perPage, currentPage, isLengthAware: true })

    // let { data, pagination } = await db.table('inventory').paginate({ perPage, currentPage, isLengthAware: true })
    data = data.map(item => Object.assign({}, item));
    data = marshal(data);
    const inventory = data as Product[];
    const result: PaginationResult<Product[]> = { data: inventory, pagination };

    return result;
  } catch(error: any) {
    console.error(error);
    return { 
      data: [], 
      pagination: paginationData };
  }

}

export async function seedGallery(): Promise<GallerySeeding[]> {
  try {
    let images = await db.table<any>('recipe')
      .select('RecipeImageUrl')
      .whereNotNull('RecipeImageUrl');
    images = images.map(item => Object.assign({}, { src: item.RecipeImageUrl }));
    images = marshal(images);
    images = images.filter(({ src }) => src !== 'https://i.imgur.com/aOQBTkN.png') // this pic sucks
    return images;
  } catch(error: any) {
    console.error(error);
    return [];
  }
}

export async function getBaseSpirits(): Promise<string[]> {
  try {
    let result = await db
      .table<any>('recipecategory')
      .select('RecipeCategoryDescription')
    result = marshal(result);
    result = result.map(({ recipeCategoryDescription }) => recipeCategoryDescription);
    return result;
  } catch(error: any) {
    console.error(error);
    return [];
  }
}

export async function categorySelect(): Promise<SelectOption[]> {
  try {
    let result = await db.table('category')
                          .select('CategoryId', 'CategoryName');
    let categories: Category[] = marshal<Category>(result);
    let selectOptions: SelectOption[] = categories.map(({ categoryId, categoryName}) => ({
      name: categoryName,
      value: categoryId
    }));
    return selectOptions;
  } catch(error: any) {
    console.error(error);
    return [];
  }
}

export async function addToInventory(product: Product, image: File | null = null): Promise<QueryResult<Product>> {
  try {
    let parentRowId: number | undefined, childRowId: number | undefined;
    await db.query.transaction(async (trx) => {

      const [parentRow] = await trx('product')
        .insert({
          CategoryId: product.categoryId,
          SupplierId: product.supplierId,
          ProductName: product.productName,
          ProductInStockQuantity: product.productInStockQuantity,
          ProductUnitSizeInMilliliters: product.productUnitSizeInMilliliters,
          ProductPricePerUnit: product.productPricePerUnit,
          ProductProof: product.productProof
        });
      parentRowId = parentRow;

      const getProductImageUrl = async (image: File | null) => {
        if(!image || image.size === 0 || image.name === 'undefined') return null;
        const signedUrl = await getSignedUrl(image);
        return (signedUrl.length? signedUrl : null);
      }

      const productImageUrl = await getProductImageUrl(image);
      const [childRow] = await trx('productdetail')
        .insert({
          ProductId: parentRowId,
          ProductImageUrl: productImageUrl,
          ProductDescription: product.productDescription,
          ProductSweetnessRating: product.productSweetnessRating,
          ProductDrynessRating: product.productDrynessRating,
          ProductVersatilityRating: product.productVersatilityRating,
          ProductStrengthRating: product.productStrengthRating
        }).onConflict('ProductId').merge();

      childRowId = childRow;

      await trx.commit();
    });

    if(!parentRowId || !childRowId) {
      throw Error('No rows have been inserted.')
    }

    const newRow = await findInventoryItem(parentRowId);
    if(!newRow) {
      throw Error('Cannot find newly inserted item.')
    }

    return {
      status: 'success',
      data: newRow
    }
    // const new 
    // return await findInventoryItem(values.ProductId)
  } catch(error: any) {
    console.log(error);
    Logger.error(error.sqlMessage, error.sql);
    return {
      status: 'error',
      error: 'Could not add new item to inventory.'
    }
  }
}

export async function searchInventory(search: string): Promise<Product[]> {
  try {
    let data = await db.table('inventory').where('productName', 'like', `%${search}%`)
    // let data = await db.table('product')
    //   .select([
    //     'product.productId',
    //     'product.supplierId',
    //     'product.productName',
    //     'product.productPricePerUnit',
    //     'product.productInStockQuantity',
    //     'product.productUnitSizeInMilliliters',
    //     'product.productProof',
    //     'category.categoryId',
    //     'category.categoryName',
    //     'category.categoryDescription',
    //     'productdetail.productImageUrl',
    //     'productdetail.productDetailId',
    //   ])
    //   .innerJoin('category', 'category.categoryId', '=', 'product.categoryId')
    //   .leftJoin('productdetail', 'product.ProductId', '=', 'productdetail.ProductId')
    //   .where('product.productName', 'like', `%${search}%`)
    let result: Product[] = marshal<Product[]>(data);
    // const result: PaginationResult<Product[]> = { data, pagination };
    return result;
  } catch(error: any) {
    console.error(error);
    return []
  }
}

export async function findInventoryItem(inventoryId: number): Promise<Product | null> {
  try {
    let data = await db.table<Product>('inventory').where("ProductId", inventoryId).select();
    let result: Product[] = marshal<Product[]>(data);
    if(result.length === 0) {
      throw Error('Product not found')
    }

    const [search] = result;
    return search;
  
  } catch(error: any) {
    console.error(error);
    return null;
  }
}


export async function addProductImage(productId: number, file: File): Promise<Record<"productDetailId", number>> {
  try {

    const signedUrl = await getSignedUrl(file);
    if(!signedUrl) throw Error('File could not be uploaded.');

    const result = await db.table('productdetail').insert({
      ProductId: productId,
      ProductImageUrl: signedUrl
    });
    const [productDetailId] = result || [-1];
    return { productDetailId: productDetailId }
  } catch(error: any) {
    console.error(error);
    return { productDetailId: -1 };
  }
}

export async function editProductImage(productId: number, file: File): Promise<Record<"productDetailId", number>> {
  try {

    const signedUrl = await getSignedUrl(file);
    if(!signedUrl) throw Error('File could not be uploaded.');

    const result = await db.table('productdetail')
    .where("ProductId", productId)
    .update({
      ProductId: productId,
      ProductImageUrl: signedUrl
    });
    if(result !== productId) throw Error('Product image could not be updated.')
    return { productDetailId: result };
  } catch(error: any) {
    console.error(error);
    return { productDetailId: -1 };
  }
}

export async function updateInventory(product: Product, image: File | null = null): Promise<Product | null> {

  try {
    if(!product?.productId) throw Error('No inventory ID provided.');

    const productImageUrl = (async (image) => {

      let oldImage: any = await db.table('productdetail').select('ProductImageUrl').where({
        ProductId: product.productId
      }).limit(1);

      [oldImage] = marshal(oldImage, camelCase);
      

      if(!oldImage?.productImageUrl) {
        oldImage = {
          productImageUrl: undefined
        }
      }
      // check here
      oldImage.productImageUrl = oldImage?.productImageUrl || null;

      if(!image || image.size === 0 || image.name === 'undefined') {
        return oldImage.productImageUrl
      }
      const signedUrl = await getSignedUrl(image);
      return signedUrl || oldImage.productImageUrl
    })

    const signedUrl = await productImageUrl(image);

    product = { ...product, productImageUrl: signedUrl, supplierId: 1 }
    const values = marshal(product, pascalCase);

    await db.query.transaction(async (trx) => {
      
      await trx('product')
      // .where("ProductId", values.ProductId)
        .insert({
          ProductId: values.ProductId, 
          CategoryId: values.CategoryId,
          SupplierId: values.SupplierId,
          ProductName: values.ProductName,
          ProductInStockQuantity: values.ProductInStockQuantity,
          ProductUnitSizeInMilliliters: values.ProductUnitSizeInMilliliters,
          ProductPricePerUnit: values.ProductPricePerUnit,
          ProductProof: values.ProductProof
        }).onConflict('ProductId').merge();


      await trx('productdetail')
      .insert({
        ProductId: values.ProductId,
        ProductImageUrl: values.ProductImageUrl,
        ProductDescription: values.ProductDescription,
        ProductSweetnessRating: values.ProductSweetnessRating,
        ProductDrynessRating: values.ProductDrynessRating,
        ProductVersatilityRating: values.ProductVersatilityRating,
        ProductStrengthRating: values.ProductStrengthRating
      }).onConflict('ProductId').merge();     

      await trx.commit();

    });

    return await findInventoryItem(values.ProductId)


  } catch(error: any) {
    console.error(error);
    return null;
  }
}

export async function deleteInventoryItem(productId: number): Promise<QueryResult<number>> {
  
  // need to delete https://storage.googleapis.com/busser/IMG_5139.JPEG-0724202448
  try {
    let productImageUrl: string | undefined, rowsDeleted: number | undefined;
    await db.query.transaction(async (trx) => {
      let childRow  = await trx('productdetail')
        .select('ProductImageUrl')
        .where('ProductId', productId)
        .first();
      childRow = marshal(childRow, camelCase);
      if(childRow?.productImageUrl) {
        productImageUrl = childRow.productImageUrl;
      }

      const rows = await db
        .table<Product>('product')
        .where('ProductId', productId)
        .del();

      rowsDeleted = rows;
      await trx.commit();
    });

    if(productImageUrl) {
      await deleteSignedUrl(productImageUrl);
    }
    // const productDetail = await db
    //   .table<ProductDetail>('productdetail')
    //     .where('ProductId', productId)
    //       .del();

    //       console.log(productDetail)
    // console.log(productDetail)
    // const rowsDeleted = await db
    //   .table<Product>('product')
    //     .where('ProductId', productId)
    //       .del();

    return {
      status: 'success',
      data: rowsDeleted || 0
    } satisfies QueryResult<number>;

  } catch(error: any) {
    console.error(error);
    Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace)
    return {
      status: 'error',
      error: 'Could not delete inventory item.'
    } satisfies QueryResult<number>;
  }
}

export async function getSpirits(): Promise<Array<Spirit>> {
  try {
    const dbResult = await db.table<Spirit>('spirits');
    const result = marshal<Spirit>(dbResult);
    return result;
  } catch(error) {
    console.error(error);
    return [];
  }
}
export async function getSpirit(id: number | string): Promise<Spirit | null> {
  try {
    const dbResult = await db.table<Spirit>('spirits').where('RecipeCategoryId', id);
    const [result] = marshal<Spirit>(dbResult);
    if(!result) throw Error('Spirit not found.')
    return result;
  } catch(error) {
    console.error(error);
    return null;
  }
}

export async function getBasicRecipes(recipeCategoryId: number | string | null = null): Promise<QueryResult<Array<BasicRecipe>>> {
  try {
    let query = db.table<BasicRecipe>('basicrecipe');
    if(recipeCategoryId) {
      query.where('recipeCategoryId', recipeCategoryId);
    }
    const dbResult = await query;
    const data = marshal<Array<BasicRecipe>>(dbResult);
    const result: QueryResult<Array<BasicRecipe>> = {
      status: 'success',
      data
    }
    return result;
  } catch(error: any) {
    console.error(error);
    Logger.error(error.sqlMessage || error.message, error.sql || error.stackTrace);
    const result: QueryResult<Array<BasicRecipe>> = {
      status: 'error',
      error: 'Could not get basic recipes for specified query.'
    };
    return result;
  }
}