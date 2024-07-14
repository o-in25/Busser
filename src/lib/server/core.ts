
import type { GallerySeeding, Product } from "$lib/types";
import { DbProvider } from "./db";
import _ from 'lodash';
import { attachPaginate, type IWithPagination } from "knex-paginate";
const db = new DbProvider('app_t');

const marshal = (obj: any) => {
  if(!_.isObject(obj)) return obj;
  if(_.isArray(obj)) return obj.map((v) => marshal(v));
  return _.reduce(obj, (arr, curr, acc) => {
    return {
      ...arr,
      [_.camelCase(acc)]: marshal(curr)
    };
  }, {});
};

export async function getInventory(): Promise<IWithPagination<Product>> {
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
      .paginate({ perPage: 30, currentPage: 1})
    data = data.map(item => Object.assign({}, item));
    data = marshal(data);
    const result: IWithPagination<Product> = { data, pagination };

    return result;
  } catch(error: any) {
    console.error(error);
    return { data: null, pagination: null } as unknown as IWithPagination<any>;
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
