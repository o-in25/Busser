
import type { GallerySeeding, PaginationData, PaginationResult, Product } from "$lib/types";
import { DbProvider } from "./db";
import _ from 'lodash';
import { type ILengthAwarePagination, type IWithPagination } from "knex-paginate";
import { Pagination } from "flowbite-svelte";

const db = new DbProvider('app_t');
//attachPaginate();

const marshal = <T>(obj: any) => {
  if(!_.isObject(obj)) return obj as T ;
  if(_.isArray(obj)) return obj.map((v) => marshal<T>(v));
  return _.reduce(obj, (arr, curr, acc) => {
    return {
      ...arr,
      [_.camelCase(acc)]: marshal<T>(curr)
    };
  }, {});
};

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
    let spirits = await db.table<any>('recipecategory')
      .select('RecipeCategoryDescription')
    spirits = spirits.map(item => item.RecipeCategoryDescription);
    spirits = marshal(spirits);

    return spirits;
  } catch(error: any) {
    console.error(error);
    return [];
  }
}
