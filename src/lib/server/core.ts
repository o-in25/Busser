
import type { Category, FormSubmitResult, GallerySeeding, PaginationResult, Product, ProductDetail, SelectOption } from "$lib/types";
import { DbProvider } from "./db";
import _ from 'lodash';
import * as changeCase from "change-case";
import { getSignedUrl } from "./storage";
import { P } from "flowbite-svelte";

const db = new DbProvider('app_t');

const marshal = <T>(obj: any, fn: Function = camelCase) => {
  if(!_.isObject(obj)) return obj as T ;
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
    let { data, pagination } = await db.table('product')
      .select([
        'product.productId',
        'product.supplierId',
        'product.productName',
        'product.productPricePerUnit',
        'product.productInStockQuantity',
        'product.productUnitSizeInMilliliters',
        'product.productProof',
        'category.categoryId',
        'category.categoryName',
        'category.categoryDescription',
        'productdetail.productImageUrl',
        'productdetail.productDetailId',
      ])
      .innerJoin('category', 'category.categoryId', '=', 'product.categoryId')
      .leftJoin('productdetail', 'product.ProductId', '=', 'productdetail.ProductId')
      .paginate({ perPage, currentPage, isLengthAware: true })
    data = data.map(item => Object.assign({}, item));
    data = marshal(data);
    const result: PaginationResult<Product[]> = { data, pagination };

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

export async function addToInventory(product: Product): Promise<Record<"productId", number>> {
  try {
    let insert = marshal(product, pascalCase);
    const result = await db.table('product').insert({ 
      ...insert,
      SupplierId: 1,
      ProductInStockQuantity: 1
    });
    const [productId] =  result || [-1];
    return { productId }
  } catch(error: any) {
    console.error(error);
    return { productId: -1 }
  }
}

export async function searchInventory(search: string): Promise<Product[]> {
  try {
    let data = await db.table('product')
      .select([
        'product.productId',
        'product.supplierId',
        'product.productName',
        'product.productPricePerUnit',
        'product.productInStockQuantity',
        'product.productUnitSizeInMilliliters',
        'product.productProof',
        'category.categoryId',
        'category.categoryName',
        'category.categoryDescription',
        'productdetail.productImageUrl',
        'productdetail.productDetailId',
      ])
      .innerJoin('category', 'category.categoryId', '=', 'product.categoryId')
      .leftJoin('productdetail', 'product.ProductId', '=', 'productdetail.ProductId')
      .where('product.productName', 'like', `%${search}%`)
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
    let data = await db.table('product')
      .select([
        'product.productId',
        'product.supplierId',
        'product.productName',
        'product.productPricePerUnit',
        'product.productInStockQuantity',
        'product.productUnitSizeInMilliliters',
        'product.productProof',
        'category.categoryId',
        'category.categoryName',
        'category.categoryDescription',
        'productdetail.productImageUrl',
        'productdetail.productDescription',
        'productdetail.productSweetnessRating',
        'productdetail.productDrynessRating',
        'productdetail.productVersatilityRating',
        'productdetail.productStrengthRating',
      ])
      .where('product.productId', inventoryId)
      .innerJoin('category', 'category.categoryId', '=', 'product.categoryId')
      .leftJoin('productdetail', 'product.ProductId', '=', 'productdetail.ProductId');
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

export async function updateInventory(product: Product): Promise<Product | null> {
  try {
    const { productId, ...update } = product;
    let insert = marshal(update, pascalCase);
    const result = await db
    .table<Product>('product')
      .where("ProductId", productId)
        .update({
          ...insert,
          SupplierId: 1,
          ProductInStockQuantity: 1
        });
  

    if(result === 0) throw Error('Could not update inventory.')
    const [newRow] = await db
      .table<Product>('product')
        .select(Object.keys(insert))
          .where("ProductId", productId);

    if(!newRow) {
      throw Error('Inventory item updated but could not be retrieved.');
    }

    return marshal<Product>(newRow, camelCase)

  } catch(error: any) {
    console.error(error);
    return null;
  }
}

export async function deleteInventoryItem(productId: number): Promise<number> {
  // need to delete https://storage.googleapis.com/busser/IMG_5139.JPEG-0724202448
  try {
    // const productDetail = await db
    //   .table<ProductDetail>('productdetail')
    //     .where('ProductId', productId)
    //       .del();

    //       console.log(productDetail)
    // console.log(productDetail)
    const rowsDeleted = await db
      .table<Product>('product')
        .where('ProductId', productId)
          .del();

    return rowsDeleted;
  } catch(error) {
    console.error(error);
    return 0;
  }
}