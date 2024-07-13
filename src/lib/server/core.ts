
import type { GallerySeeding, Product } from "$lib/types";
import { DbProvider } from "./db";
import _ from 'lodash';
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

export async function getInventory(): Promise<Product[]> {
  try {
    
    let inventory = await db.table<Product>('product')
      .join('productdetail', 'product.ProductId', '=', 'productdetail.ProductId')
      .join('category', 'category.CategoryId', '=', 'product.ProductId')
    inventory = inventory.map(item => Object.assign({}, item));
    inventory = marshal(inventory);
    return inventory;
  } catch(error: any) {
    console.error(error);
    return [];
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