/**
 * this code sucks
 * 
 * i should probably (definitely) be using an orm like prisma
 * 
 * this is what happens when you start with just a poc to get something working
 * and youre too lazy to back and refactor it so you just keep adding on 
 * until you arrive at this monstrosity 
 * 
 * im in too deep
 */
import type {
  BasicRecipe,
  Category,
  GallerySeeding,
  PaginationResult,
  PreparationMethod,
  Product,
  QueryResult,
  SelectOption,
  Spirit,
  Table,
  QueryRequest,
  View,
} from "$lib/types";
import { DbProvider } from "./db";
import * as changeCase from "change-case";
import { deleteSignedUrl, getSignedUrl } from "./storage";
import { Logger } from "./logger";

const db = new DbProvider("app_t");

const marshal = <T>(obj: any, fn: Function = camelCase) => {
  if(Array.isArray(obj)) {
    return obj.map((v) => marshal<T>(v, fn));
  }

  if(obj && typeof obj === 'object') {
    return Object.keys(obj).reduce((arr, key) => {
      arr[fn(key)] = marshal<T>(obj[key], fn); 
      return arr;
    }, {} as Record<string, T>);
  }

  return obj as T;

};


const marshalToType = <T>(obj: any, fn: Function = camelCase): T => {
  if(!obj && typeof obj === 'object') return obj as T;
  if(Array.isArray(obj)) return obj.map((v) => marshal<T>(v)) as T;
  return Object.entries(obj).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [fn(key)]: marshal<T>(value),
    }),
    {} as T
  );
};

const pascalCase = (str: string) => changeCase.pascalCase(str); // GoodDrinks
const camelCase = (str: string) => changeCase.camelCase(str); // goodDrinks
const titleCase = (str: string) => changeCase.capitalCase(str); // Good Drinks

const paginationData = {
  total: 0,
  currentPage: 0,
  perPage: 0,
  from: 0,
  to: 0,
  lastPage: 0,
  prevPage: 0,
  nextPage: 0,
};

export async function getCatalog(currentPage: number, perPage: number = 25, filter: Partial<View.BasicRecipe> & Partial<View.BasicRecipeStep> | null = null) {
  try {
    let query = db.table('basicrecipe as r').select();
    if(filter?.productInStockQuantity) {
      query = query.whereIn(
        'r.RecipeId',
        db.table('basicrecipestep as rs')
          .select('rs.RecipeId')
          .groupBy('rs.RecipeId')
          .having(
            db.query.raw('COUNT(rs.RecipeStepId) = COUNT(CASE WHEN rs.ProductInStockQuantity = ? THEN 1 END)', [filter.productInStockQuantity])
          )
      );
    }

    query = query.orderBy('recipeName');
    let dbResult: any = await query.paginate({ perPage, currentPage, isLengthAware: true });
    dbResult = marshalToType<View.BasicRecipe[]>(dbResult);
    return dbResult;
  } catch (error: any) {
    console.error(error);
  }
}

export async function getInventory(
  currentPage: number,
  perPage: number = 25,
  filter: Partial<Product> | null = null
): Promise<PaginationResult<Product[]>> {
  try {

    let dbResult = db.table('inventory');
    if(filter?.productName) {
      dbResult = dbResult.where("productName", "like", `%${filter.productName}%`);
    }

    if(typeof filter?.productInStockQuantity !== 'undefined') {
      console.log(filter.productInStockQuantity)
      dbResult = dbResult.andWhere("productInStockQuantity", "=", filter.productInStockQuantity);
    }

    let { data, pagination } = await dbResult
      .select()
      .orderBy('productName')
      .paginate({ perPage, currentPage, isLengthAware: true });
    
    // let { data, pagination } = await db
    //   .table("inventory")
    //   .select()
    //   .paginate({ perPage, currentPage, isLengthAware: true });

    // let { data, pagination } = await db.table('inventory').paginate({ perPage, currentPage, isLengthAware: true })
    data = data.map((item) => Object.assign({}, item));
    data = marshal(data);
    const inventory = data as Product[];
    const result: PaginationResult<Product[]> = { data: inventory, pagination };

    return result;
  } catch (error: any) {
    console.error(error);
    return {
      data: [],
      pagination: paginationData,
    };
  }
}

export async function seedGallery(): Promise<QueryResult<View.BasicRecipe[]>> {
  try {
    // let dbResult = await db.table('availablerecipes').select('RecipeId').groupBy('RecipeId');
    let dbResult = await db.table('basicrecipe').whereIn('RecipeId', function() {
      this.select('RecipeId').from('availablerecipes').groupBy('RecipeId');
    })
    const data: View.BasicRecipe[] = marshalToType<View.BasicRecipe[]>(dbResult);
    return { status: 'success', data }
  } catch (error: any) {
    console.error(error);
    return {
      status: 'error',
      error: 'Unable to get recipes.'
    }
  }
}

export async function getBaseSpirits(): Promise<QueryResult<View.BasicRecipeCategory[]>> {
  try {
    let dbResult = await db.table<View.BasicRecipeCategory>('basicrecipecategory').select();
    const data: View.BasicRecipeCategory[] = marshalToType<View.BasicRecipeCategory[]>(dbResult);
    return { status: 'success', data }
  } catch (error: any) {
    console.error(error);
    Logger.error(
      error.sqlMessage || error.message,
      error.sql || error.stackTrace,
    );
    return {
      status: 'error',
      error: error.sqlMessage || error.message
    };
  }
}

export async function categorySelect(): Promise<SelectOption[]> {
  try {
    let result = await db
      .table("category")
      .select("CategoryId", "CategoryName");
    let categories: Category[] = marshal<Category>(result);
    let selectOptions: SelectOption[] = categories.map(
      ({ categoryId, categoryName }) => ({
        name: categoryName,
        value: categoryId,
      }),
    );
    return selectOptions;
  } catch (error: any) {
    console.error(error);
    return [];
  }
}

export async function addToInventory(
  product: Product,
  image: File | null = null,
): Promise<QueryResult<Product>> {
  try {
    let parentRowId: number | undefined, childRowId: number | undefined;
    await db.query.transaction(async (trx) => {
      const [parentRow] = await trx("product").insert({
        CategoryId: product.categoryId,
        SupplierId: product.supplierId,
        ProductName: product.productName,
        ProductInStockQuantity: product.productInStockQuantity,
        ProductUnitSizeInMilliliters: product.productUnitSizeInMilliliters,
        ProductPricePerUnit: product.productPricePerUnit,
        ProductProof: product.productProof,
      });
      parentRowId = parentRow;

      const getProductImageUrl = async (image: File | null) => {
        if (!image || image.size === 0 || image.name === "undefined")
          return null;
        const signedUrl = await getSignedUrl(image);
        return signedUrl.length ? signedUrl : null;
      };

      const productImageUrl = await getProductImageUrl(image);
      const [childRow] = await trx("productdetail")
        .insert({
          ProductId: parentRowId,
          ProductImageUrl: productImageUrl,
          ProductDescription: product.productDescription,
          ProductSweetnessRating: product.productSweetnessRating,
          ProductDrynessRating: product.productDrynessRating,
          ProductVersatilityRating: product.productVersatilityRating,
          ProductStrengthRating: product.productStrengthRating,
        })
        .onConflict("ProductId")
        .merge();

      childRowId = childRow;

      await trx.commit();
    });

    if (!parentRowId || !childRowId) {
      throw new Error("No rows have been inserted.");
    }

    const newRow = await findInventoryItem(parentRowId);
    if (!newRow) {
      throw new Error("Cannot find newly inserted item.");
    }

    return {
      status: "success",
      data: newRow,
    };
    // const new
    // return await findInventoryItem(values.ProductId)
  } catch (error: any) {
    console.error(error);
    Logger.error(error.sqlMessage, error.sql);
    return {
      status: "error",
      error: "Could not add new item to inventory.",
    };
  }
}


export async function findInventoryItem(
  inventoryId: number,
): Promise<Product | null> {
  try {
    let data = await db
      .table<Product>("inventory")
      .where("ProductId", inventoryId)
      .select();
    let result: Product[] = marshal<Product[]>(data);
    if (result.length === 0) {
      throw Error("Product not found");
    }

    const [search] = result;
    return search;
  } catch (error: any) {
    console.error(error);
    return null;
  }
}


export async function updateInventory(
  product: Product,
  image: File | null = null,
): Promise<QueryResult<Product>> {
  try {
    if (!product?.productId) throw Error("No inventory ID provided.");

    const productImageUrl = async (image) => {
      let oldImage: any = await db
        .table("productdetail")
        .select("ProductImageUrl")
        .where({
          ProductId: product.productId,
        })
        .limit(1);

      [oldImage] = marshal(oldImage, camelCase);

      if (!oldImage?.productImageUrl) {
        oldImage = {
          productImageUrl: undefined,
        };
      }
      // check here
      oldImage.productImageUrl = oldImage?.productImageUrl || null;

      if (!image || image.size === 0 || image.name === "undefined") {
        return oldImage.productImageUrl;
      }
      const signedUrl = await getSignedUrl(image);
      return signedUrl || oldImage.productImageUrl;
    };

    const signedUrl = await productImageUrl(image);

    product = { ...product, productImageUrl: signedUrl, supplierId: 1 };
    const values = marshal(product, pascalCase);

    await db.query.transaction(async (trx) => {
      await trx("product")
        // .where("ProductId", values.ProductId)
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
        .onConflict("ProductId")
        .merge();

      await trx("productdetail")
        .insert({
          ProductId: values.ProductId,
          ProductImageUrl: values.ProductImageUrl,
          ProductDescription: values.ProductDescription,
          ProductSweetnessRating: values.ProductSweetnessRating,
          ProductDrynessRating: values.ProductDrynessRating,
          ProductVersatilityRating: values.ProductVersatilityRating,
          ProductStrengthRating: values.ProductStrengthRating,
        })
        .onConflict("ProductId")
        .merge();

      await trx.commit();
    });

    const newItem = await findInventoryItem(values.ProductId);
    if(!newItem) throw new Error('Inventory was succesfully updated, but the subquery returned no results.');
    return {
      status: 'success',
      data: newItem
    }
  } catch (error: any) {
    console.error(error);
    return {
      status: "error",
      error: "Could not update inventory.",
    };
  }
}

export async function deleteInventoryItem(
  productId: number,
): Promise<QueryResult<number>> {
  // need to delete https://storage.googleapis.com/busser/IMG_5139.JPEG-0724202448
  try {
    let productImageUrl: string | undefined, rowsDeleted: number | undefined;
    await db.query.transaction(async (trx) => {
      let childRow = await trx("productdetail")
        .select("ProductImageUrl")
        .where("ProductId", productId)
        .first();
      childRow = marshal(childRow, camelCase);
      if (childRow?.productImageUrl) {
        productImageUrl = childRow.productImageUrl;
      }


      // TODO: use a foreign key constraint to delete
      // idk why i didnt do this to begin with
      const rows = await db
        .table<Product>("product")
        .where("ProductId", productId)
        .del();

      rowsDeleted = rows;
      await trx.commit();
    });

    if (productImageUrl) {
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
      status: "success",
      data: rowsDeleted || 0,
    } satisfies QueryResult<number>;
  } catch (error: any) {
    console.error(error);
    Logger.error(
      error.sqlMessage || error.message,
      error.sql || error.stackTrace,
    );
    return {
      status: "error",
      error: "Could not delete inventory item.",
    } satisfies QueryResult<number>;
  }
}

export async function getSpirits(): Promise<Array<Spirit>> {
  try {
    const dbResult = await db.table<Spirit>("spirits");
    const result = marshal<Spirit>(dbResult);
    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getSpirit(id: number | string): Promise<Spirit | null> {
  try {
    const dbResult = await db
      .table<Spirit>("spirits")
      .where("RecipeCategoryId", id);
    const [result] = marshal<Spirit>(dbResult);
    if (!result) throw Error("Spirit not found.");
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getBasicRecipes(
  recipeCategoryId: number | string | null = null,
): Promise<QueryResult<Array<BasicRecipe>>> {
  try {
    let query = db.table<BasicRecipe>("basicrecipe");
    if (recipeCategoryId) {
      query.where("recipeCategoryId", recipeCategoryId);
    }
    const dbResult = await query;
    const data = marshal<Array<BasicRecipe>>(dbResult);
    const result: QueryResult<Array<BasicRecipe>> = {
      status: "success",
      data,
    };
    return result;
  } catch (error: any) {
    console.error(error);
    Logger.error(
      error.sqlMessage || error.message,
      error.sql || error.stackTrace,
    );
    const result: QueryResult<Array<BasicRecipe>> = {
      status: "error",
      error: "Could not get basic recipes for specified query.",
    };
    return result;
  }
}

export async function getPreparationMethods(): Promise<
  QueryResult<Array<PreparationMethod>>
> {
  try {
    const dbResult = await db.table<PreparationMethod>("preparationmethod");
    const data = marshal<Array<PreparationMethod>>(dbResult);
    const result: QueryResult<Array<PreparationMethod>> = {
      status: "success",
      data,
    };

    return result;
  } catch (error: any) {
    console.error(error);
    Logger.error(
      error.sqlMessage || error.message,
      error.sql || error.stackTrace,
    );
    const result: QueryResult<Array<PreparationMethod>> = {
      status: "error",
      error: "Could not get preparation methods.",
    };
    return result;
  }
}


export async function addCategory(
  categoryName: string,
  categoryDescription: string | null,
): Promise<QueryResult<number>> {
  try {
    let newCategory: any = { categoryName, categoryDescription };
    newCategory = {
      ...newCategory,
      categoryName: titleCase(categoryName.trim()), // enforcing unique index i
    };
    newCategory = marshal(newCategory, pascalCase);
    const [categoryId] = await db
      .table<Table.Category>("category")
      .insert(newCategory);
    return {
      status: "success",
      data: categoryId,
    };
  } catch (error: any) {
    console.error(error);
    Logger.error(
      error.sqlMessage || error.message,
      error.sql || error.stackTrace,
    );

    return {
      status: "error",
      error: error?.code || "An unknown error occurred.",
    };
  }
}

export async function getBasicRecipe(
  recipeId: string,
): Promise<
  QueryResult<{ recipe: View.BasicRecipe; recipeSteps: View.BasicRecipeStep[] }>
> {
  try {
    let recipe: View.BasicRecipe | undefined = undefined;
    let recipeSteps: View.BasicRecipeStep[] | undefined = undefined;

    await db.query.transaction(async (trx) => {
      let [dbResult] = await trx("basicrecipe").select().where({ recipeId });
      recipe = marshal<View.BasicRecipe>(dbResult, camelCase);
      dbResult = await trx("basicrecipestep").select().where({ recipeId });
      recipeSteps = marshal<View.BasicRecipeStep[]>(dbResult, camelCase);
    });

    if (!recipe || !recipeSteps) {
      throw Error("Could not get recipe details.");
    }

    return {
      status: "success",
      data: { recipe, recipeSteps },
    };
  } catch (error: any) {
    console.error(error);
    Logger.error(
      error.sqlMessage || error.message,
      error.sql || error.stackTrace,
    );

    return {
      status: "error",
      error: error?.code || "An unknown error occurred.",
    };
  }
}


export async function productSelect(): Promise<SelectOption[]> {
  try {
    let result = await db.table("product").select("ProductId", "ProductName");
    let products: Product[] = marshal<Product[]>(result);
    let selectOptions: SelectOption[] = products.map(
      ({ productId, productName }) => ({
        name: productName,
        value: productId || 0,
      }),
    );
    return selectOptions;
  } catch (error: any) {
    console.error(error);
    return [];
  }
}

// change to update catalog
export async function updateCatalog(
  recipe: QueryRequest.Recipe,
  recipeSteps: QueryRequest.RecipeSteps[],
  file: File,
): Promise<
  QueryResult<{ recipe: View.BasicRecipe; recipeSteps: View.BasicRecipeStep[] }>
> {
  // STEP 1: [NOT NEEDED] get signed file url
  // image url will be set via webhook not in form itself
  // STEP 2: get recipe desc from recipe.
  // STEP 3: update recipe desc
  // STEP 4: update recipe tech
  // STEP 5: update recipe
  // STEP 6: delete old recipe steps (might have to be done before step 6)
  // STEP 7: update recipe steps
  // STEP 8: return new view



  const getRecipeImageUrl = async (image: File | null): Promise<string | null> => {
    if (!image || image.size === 0 || image.name === "undefined") return null;
    const signedUrl = await getSignedUrl(image);
    return signedUrl.length ? signedUrl : null;
  }


  // step 1 (originally)
  const recipeImageUrl = await getRecipeImageUrl(file);

  try {
    let newRecipe: {
      recipe: View.BasicRecipe;
      recipeSteps: View.BasicRecipeStep[];
    } = { recipe: {} as View.BasicRecipe, recipeSteps: [] };

    await db.query.transaction(async (trx) => {
      // keys to look up tables
      let keys: {
        recipeDescriptionId: number | undefined;
        recipeId: number | undefined;
      } = {
        // recipeCategoryId: null,
        recipeDescriptionId: undefined,
        recipeId: undefined,
      };

      let dbResult;
      
      let oldRecipe = await trx("recipe")
        // TODO: do we need RecipeCategoryId?
        .select("RecipeDescriptionId", "RecipeCategoryId")
        .where("RecipeId", recipe.recipeId || -1)
        .first();

      oldRecipe = marshal(oldRecipe, camelCase);

      if (!oldRecipe) {
        [dbResult] = await trx("recipedescription").insert({
          RecipeDescription: recipe.recipeDescription,
          RecipeDescriptionImageUrl: null, // TODO: add option for this on front end
          RecipeSweetnessRating: recipe.recipeSweetnessRating,
          RecipeDrynessRating: recipe.recipeDrynessRating,
          RecipeStrengthRating: recipe.recipeStrengthRating,
          RecipeVersatilityRating: recipe.recipeVersatilityRating,
        });

        
        if (!dbResult) throw new Error("Cannot create recipe description.");
        keys.recipeDescriptionId = dbResult;

        [dbResult] = await trx("recipe").insert({
          RecipeCategoryId: recipe.recipeCategoryId,
          RecipeDescriptionId: keys.recipeDescriptionId,
          RecipeName: recipe.recipeName,
          RecipeImageUrl: recipeImageUrl /* <signed url> */,
        });

        if (!dbResult) throw new Error("Cannot create recipe.");
        keys.recipeId = dbResult;
        // oldRecipe = keys;

      } else {
        keys = {
          recipeDescriptionId: oldRecipe.recipeDescriptionId,
          recipeId: recipe.recipeId,
        };
      }

      // step 3
      if (oldRecipe) {

        console.log(recipe)
        dbResult = await trx("recipedescription")
          .where("RecipeDescriptionId", keys.recipeDescriptionId)
          .update({
            RecipeDescription: recipe.recipeDescription,
            // RecipeDescriptionUrl: null
            RecipeSweetnessRating: recipe.recipeSweetnessRating,
            RecipeDrynessRating: recipe.recipeDrynessRating,
            RecipeStrengthRating: recipe.recipeStrengthRating,
            RecipeVersatilityRating: recipe.recipeVersatilityRating,
          });

        if (!dbResult) throw new Error("Recipe description not found.");
      }

      // step 4
      dbResult = await trx("recipetechnique")
        .insert({
          RecipeTechniqueDescriptionId: recipe.recipeTechniqueDescriptionId,
          RecipeId: keys.recipeId, //recipe.recipeId
        })
        .onConflict("RecipeId")
        .merge();

      // step 5
      if (oldRecipe) {

        // TODO: we should come up with a better fix for this
        // otherwise a user cant delete an image. until then
        // we dont update the query with the image if its null (ie deleted)

        let query: any = {
          RecipeId: recipe.recipeId,
          RecipeCategoryId: recipe.recipeCategoryId,
          RecipeDescriptionId: keys.recipeDescriptionId,
          RecipeName: recipe.recipeName,
          
        };

        if(recipeImageUrl !== null) {
          query = { ...query, recipeImageUrl }
        }


        dbResult = await trx("recipe")
          .insert(query)
          .onConflict("RecipeId")
          .merge();

        // step 6
        dbResult = await trx("recipestep")
          .where("RecipeId", keys.recipeId)
          .del();
      }

      // the recipe id for the steps isnt included in the form request
      // so we add them here. otherwise they would have the be done client side

      /**
       * 
       * 
       * READ THIS
       * 
       * before going forward, think about how we delete
       * steps that someone removes.
       * we probably have to iterate over each step, 
       * check if its id exists and delete it if it doesnt
      //  */

      let steps: Table.RecipeStep[] = recipeSteps.map(
        ({
          productId,
          productIdQuantityInMilliliters,
          productIdQuantityUnit,
          recipeStepDescription,
        }) => ({
          recipeId: keys.recipeId || 0,
          productId,
          productIdQuantityInMilliliters,
          productIdQuantityUnit,
          recipeStepDescription,
        }),
      );

      // step 7
      dbResult = await trx("recipestep")
        .insert(steps)
        .onConflict("RecipeId")
        .merge();

      // step 8
      dbResult = await trx("basicrecipe")
        .select()
        .where({ recipeId: keys.recipeId })
        .first();
      newRecipe.recipe = marshalToType<View.BasicRecipe>(dbResult, camelCase);
      dbResult = await trx("basicrecipestep")
        .select()
        .where({ recipeId: keys.recipeId });
      newRecipe.recipeSteps = marshalToType<View.BasicRecipeStep[]>(
        dbResult,
        camelCase,
      );

      // use update().merge() on pk
    });

    return {
      status: "success",
      data: newRecipe,
    };
  } catch (error: any) {
    console.error(error.message);
    Logger.error(
      error.sqlMessage || error.message,
      error.sql || error.stackTrace,
    );
    const result: QueryResult<Array<PreparationMethod>> = {
      status: "error",
      error: "Cannot save changes.",
    };
    return result;
  }
}


export async function deleteCatalogItem(
  recipeId: number,
): Promise<QueryResult<number>> {
  try {
    // FK_RecipeDescription_Recipe
    // FK_Recipe_RecipeDescription
    // so deleting RecipeDescription should be all we need to do
    const { deletedRows, recipeImageUrl } = await db.query.transaction(async (trx) => {
      const dbResult = await trx('recipe')
        .select("RecipeDescriptionId", "RecipeImageUrl")
        .where("RecipeId", recipeId);

      // get recipedescriptionid
      const [parentRow] = marshal(dbResult, camelCase);

      if(!parentRow) throw new Error('Recipe not found.');
      const { recipeDescriptionId, recipeImageUrl } = parentRow;

      const deletedRows = await trx('recipedescription')
        .where("RecipeDescriptionId", recipeDescriptionId)
        .del();

      if(deletedRows < 1) throw new Error('Could not delete recipe because no rows were affected.')
      // let dbResult2 = 1;
      // const [rowsDeleted] = marshal<Number>(dbResult2, camelCase);
      //   console.log(rowsDeleted)

      return {
        recipeImageUrl, deletedRows
      }
    });


    if(recipeImageUrl) {
      await deleteSignedUrl(recipeImageUrl);
    }

    return {
      status: "success",
      data: deletedRows
    } satisfies QueryResult<number>;

  } catch(error: any) {
    console.error(error.message);
    Logger.error(
      error.sqlMessage || error.message,
      error.sql || error.stackTrace,
    );
    const result: QueryResult<Array<PreparationMethod>> = {
      status: "error",
      error: "Cannot save changes.",
    };
    return result;
  }
}


export async function getCategory(categoryId: number): Promise<QueryResult<Table.Category>> {

  try {

    const dbResult: Table.Category | undefined = await db.table<Table.Category>('category').where({ categoryId }).first();
    if(!dbResult) throw new Error("No category found for given ID.");
    const category = marshalToType<Table.Category>(dbResult);
    return {
      status: "success",
      data: category,
    };
  } catch (error: any) {
    console.error(error);

    Logger.error(
      error.sqlMessage || error.message,
      error.sql || error.stackTrace,
    );
    return {
      status: "error",
      error: error?.message || "An unknown error occurred.",
    };
  }
}

export async function updateCategory(category: Table.Category): Promise<QueryResult<Table.Category>> {
  try {
    // new category
    let dbResult: any;
    let key = category.categoryId;
    const { categoryName, categoryDescription } = category;
    if(!key) {
      [dbResult] = await db.table<Table.Category>('category').insert({ categoryName, categoryDescription });
      if(!dbResult) throw new Error('Could not create new category.')
      key = dbResult;
    } else {
      dbResult = await db.table<Table.Category>('category')
        .update({ categoryName, categoryDescription })
        .where('categoryId', key);
      if(dbResult < 1) {
        if(!dbResult) throw new Error('Could not update category.')
      }
    }

    dbResult = await db.table<Table.Category>('category').where('categoryId', key).select();
    const newCategory = marshalToType<Table.Category>(dbResult);


 
    return {
      status: "success",
      data: newCategory,
    };
    // if(!dbResult) {
    //   throw new Error('Could not update category: no rows were returned.')
    // }

    // dbResult = await db.table<Table.Category>('category').where 

  } catch(error: any) {
    console.error(error);

    Logger.error(
      error.sqlMessage || error.message,
      error.sql || error.stackTrace,
    );

    return {
      status: "error",
      error: error?.message || "An unknown error occurred.",
    };

  }
}