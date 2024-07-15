
import type { GallerySeeding, PaginationResult, Product } from "$lib/types";
import { DbProvider } from "./db";
import _ from 'lodash';
import { type ILengthAwarePagination, type IWithPagination } from "knex-paginate";
import type { Pagination } from "flowbite-svelte";

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

export async function getInventory(currentPage: number, perPage: number = 25): Promise<PaginationResult<Product[]>> {
  try {
    let { data, pagination }: { data: Product[], pagination: any} = await db.table('product')
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
      .paginate({ perPage, currentPage })
    data = data.map(item => Object.assign({}, item));
    data = marshal(data);
    pagination = pagination as Pagination
    const result: PaginationResult<Product[]> = { data, pagination };

    return result;
  } catch(error: any) {
    console.error(error);
    return { 
      data: [], 
      pagination: {
        total: 0,
        currentPage: 0,
        perPage: 0,
        from: 0,
        to: 0
    }};
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
