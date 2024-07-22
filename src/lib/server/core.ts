
import type { Category, GallerySeeding, PaginationResult, Product, SelectOption } from "$lib/types";
import { DbProvider } from "./db";
import _ from 'lodash';
import * as changeCase from "change-case";

const db = new DbProvider('app_t');
//attachPaginate();

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

export async function addToInventory(product: Product) {
  try {
    let insert = marshal(product, pascalCase);
    const result = await db.table('product').insert({ 
      ...insert,
      SupplierId: 1,
      ProductInStockQuantity: 1
    });
    console.log(result)
  } catch(error: any) {
    console.error(error);

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
        'productdetail.productDetailId',
      ])
      .where('product.productId', inventoryId)
      .innerJoin('category', 'category.categoryId', '=', 'product.categoryId')
      .leftJoin('productdetail', 'product.ProductId', '=', 'productdetail.ProductId');
    let result: Product[] = marshal<Product[]>(data);
    if(result.length === 0) {
      throw Error('Product not found')
    }

    return result[0];
    // const result: PaginationResult<Product[]> = { data, pagination };

  
  } catch(error: any) {
    console.error(error);
    return null;
  }
}

// export async function categorySelect(categoryName: string): Promise<Number> {
//   try {
//     let result = await db.table('category')
//       .select('CategoryId')
//       .where({ Categ});
//     let categories: Category[] = marshal<Category>(result);
//     let selectOptions: SelectOption[] = categories.map(({ categoryId, categoryName }) => ({
//       name: categoryName,
//       value: categoryId
//     }));
//     return selectOptions;
//   } catch(error: any) {
//     console.error(error);
//     return [];
//   }
// }