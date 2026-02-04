/**
 * Baseline migration for app_d database.
 * Captures the full schema as of 2026-02-04.
 *
 * Tables: recipecategory, recipecategorydescription, recipedescription,
 *         recipetechniquedescription, supplier, category, product, productdetail,
 *         recipe, recipestep, recipetechnique, workspacefeatured, role, user, log
 * Views:  inventory, spirits, basicrecipecategory, preparationmethod, baserecipe,
 *         basicrecipe, basicrecipestep, allrecipes, recipeproducts,
 *         availablerecipes, categorydetailsview
 */
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// ── reference tables (no foreign key dependencies) ──

	await knex.schema.createTable('recipecategory', (t) => {
		t.increments('RecipeCategoryId').primary();
		t.string('RecipeCategoryDescription', 255).nullable();
	});

	await knex.schema.createTable('recipecategorydescription', (t) => {
		t.increments('RecipeCategoryDescriptionId').primary();
		t.integer('RecipeCategoryId').unsigned().notNullable();
		t.string('RecipeCategoryDescriptionText', 1000).nullable();
		t.string('RecipeCategoryDescriptionImageUrl', 1000).nullable();

		t.foreign('RecipeCategoryId').references('recipecategory.RecipeCategoryId');
	});

	await knex.schema.createTable('recipedescription', (t) => {
		t.increments('RecipeDescriptionId').primary();
		t.string('RecipeDescription', 10000).nullable();
		t.string('RecipeDescriptionImageUrl', 500).nullable();
		t.decimal('RecipeSweetnessRating', 3, 1).notNullable().defaultTo(0.0);
		t.decimal('RecipeDrynessRating', 3, 1).notNullable().defaultTo(0.0);
		t.decimal('RecipeVersatilityRating', 3, 1).notNullable().defaultTo(0.0);
		t.decimal('RecipeStrengthRating', 3, 1).notNullable().defaultTo(0.0);
	});

	await knex.schema.createTable('recipetechniquedescription', (t) => {
		t.increments('RecipeTechniqueDescriptionId').primary();
		t.string('RecipeTechniqueDescriptionText', 100).notNullable();
		t.integer('RecipeTechniqueDilutionPercentage').notNullable();
		t.string('RecipeTechniqueDescriptionInstructions', 255).nullable();
		t.string('RecipeTechniqueDescriptionImageUrl', 255).nullable();
	});

	await knex.schema.createTable('supplier', (t) => {
		t.increments('SupplierId').primary();
		t.string('SupplierName', 255).nullable();
		t.string('SupplierDetails', 255).nullable();
	});

	// ── category (references recipecategory + self-referencing + cross-db FK to user_d.workspace) ──

	await knex.schema.createTable('category', (t) => {
		t.increments('CategoryId').primary();
		t.string('WorkspaceId', 64).nullable();
		t.string('CategoryName', 255).notNullable().unique();
		t.string('CategoryDescription', 1000).nullable();
		t.integer('BaseSpiritId').unsigned().nullable();
		t.integer('ParentCategoryId').unsigned().nullable();

		t.foreign('BaseSpiritId', 'fk_category_basespirit').references(
			'recipecategory.RecipeCategoryId'
		);
		t.foreign('ParentCategoryId', 'fk_category_parent').references('category.CategoryId');
	});

	// cross-database FK: category.WorkspaceId -> user_d.workspace.workspaceId
	await knex.raw(`
		ALTER TABLE category
		ADD CONSTRAINT FK_category_workspace
		FOREIGN KEY (WorkspaceId) REFERENCES user_d.workspace(workspaceId) ON DELETE SET NULL
	`);

	// ── product (references category, supplier, cross-db FK to user_d.workspace) ──

	await knex.schema.createTable('product', (t) => {
		t.increments('ProductId').primary();
		t.string('WorkspaceId', 64).notNullable();
		t.integer('CategoryId').unsigned().notNullable();
		t.integer('SupplierId').unsigned().notNullable();
		t.string('ProductName', 255).notNullable();
		t.integer('ProductInStockQuantity').notNullable();
		t.decimal('ProductPricePerUnit', 18, 2).notNullable();
		t.decimal('ProductUnitSizeInMilliliters', 18, 2).notNullable();
		t.decimal('ProductProof', 18, 2).notNullable();

		t.foreign('CategoryId').references('category.CategoryId');
		t.foreign('SupplierId').references('supplier.SupplierId');
	});

	await knex.raw(`
		ALTER TABLE product
		ADD CONSTRAINT FK_product_workspace
		FOREIGN KEY (WorkspaceId) REFERENCES user_d.workspace(workspaceId) ON DELETE CASCADE
	`);

	// ── productdetail ──

	await knex.schema.createTable('productdetail', (t) => {
		t.increments('ProductDetailId');
		t.integer('ProductId').unsigned().notNullable().unique();
		t.string('ProductImageUrl', 500).nullable();
		t.string('ProductDescription', 1000).nullable();
		t.decimal('ProductSweetnessRating', 18, 1).defaultTo(0.0);
		t.decimal('ProductDrynessRating', 18, 1).defaultTo(0.0);
		t.decimal('ProductVersatilityRating', 18, 1).defaultTo(0.0);
		t.decimal('ProductStrengthRating', 18, 1).defaultTo(0.0);
		t.primary(['ProductDetailId', 'ProductId']);

		t.foreign('ProductId').references('product.ProductId').onDelete('CASCADE').onUpdate('CASCADE');
	});

	// ── recipe (references recipecategory, recipedescription, cross-db FK to user_d.workspace) ──

	await knex.schema.createTable('recipe', (t) => {
		t.increments('RecipeId').primary();
		t.string('WorkspaceId', 64).notNullable();
		t.integer('RecipeCategoryId').unsigned().notNullable();
		t.integer('RecipeDescriptionId').unsigned().notNullable();
		t.string('RecipeName', 255).nullable();
		t.string('RecipeImageUrl', 500).nullable();

		t.foreign('RecipeCategoryId')
			.references('recipecategory.RecipeCategoryId')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
		t.foreign('RecipeDescriptionId')
			.references('recipedescription.RecipeDescriptionId')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
	});

	await knex.raw(`
		ALTER TABLE recipe
		ADD CONSTRAINT FK_recipe_workspace
		FOREIGN KEY (WorkspaceId) REFERENCES user_d.workspace(workspaceId) ON DELETE CASCADE
	`);

	// ── recipestep (references recipe, product, category) ──

	await knex.schema.createTable('recipestep', (t) => {
		t.increments('RecipeStepId').primary();
		t.integer('RecipeId').unsigned().notNullable();
		t.integer('ProductId').unsigned().notNullable();
		t.decimal('ProductIdQuantityInMilliliters', 18, 2).notNullable();
		t.string('RecipeStepDescription', 255).nullable();
		t.string('ProductIdQuantityUnit', 10).notNullable().defaultTo('oz');
		t.integer('CategoryId').unsigned().nullable();
		t.enum('MatchMode', ['EXACT_PRODUCT', 'ANY_IN_CATEGORY', 'ANY_IN_BASE_SPIRIT'])
			.notNullable()
			.defaultTo('EXACT_PRODUCT');

		t.foreign('RecipeId').references('recipe.RecipeId').onDelete('CASCADE').onUpdate('CASCADE');
		t.foreign('ProductId').references('product.ProductId');
		t.foreign('CategoryId', 'fk_recipestep_category').references('category.CategoryId');
	});

	// ── recipetechnique (references recipetechniquedescription, recipe) ──

	await knex.schema.createTable('recipetechnique', (t) => {
		t.increments('RecipeTechniqueId').primary();
		t.integer('RecipeTechniqueDescriptionId').unsigned().notNullable();
		t.integer('RecipeId').unsigned().notNullable().unique();

		t.foreign('RecipeTechniqueDescriptionId').references(
			'recipetechniquedescription.RecipeTechniqueDescriptionId'
		);
		t.foreign('RecipeId').references('recipe.RecipeId').onDelete('CASCADE').onUpdate('CASCADE');
	});

	// ── workspacefeatured ──

	await knex.schema.createTable('workspacefeatured', (t) => {
		t.increments('featuredId').primary();
		t.string('workspaceId', 64).notNullable();
		t.integer('recipeId').unsigned().notNullable();
		t.integer('featuredOrder').notNullable().defaultTo(0);
		t.datetime('createdDate').notNullable().defaultTo(knex.fn.now());
		t.unique(['workspaceId', 'recipeId']);
		t.index('workspaceId', 'idx_workspacefeatured_workspace');

		t.foreign('recipeId', 'fk_workspacefeatured_recipe')
			.references('recipe.RecipeId')
			.onDelete('CASCADE');
	});

	// ── legacy tables (present in app_d but may not be actively used) ──

	await knex.schema.createTable('role', (t) => {
		t.increments('RoleId').primary();
		t.string('RoleName', 50).notNullable();
	});

	await knex.schema.createTable('user', (t) => {
		t.increments('UserId').primary();
		t.integer('RoleId').unsigned().notNullable();
		t.string('Username', 50).notNullable();
		t.string('HashedPassword', 500).notNullable();

		t.foreign('RoleId').references('role.RoleId');
	});

	await knex.schema.createTable('log', (t) => {
		t.increments('LogId').primary();
		t.datetime('Logged').nullable();
		t.string('Level', 50).nullable();
		t.string('Message', 2048).nullable();
		t.string('Logger', 250).nullable();
		t.string('CallSite', 512).nullable();
		t.string('Exception', 512).nullable();
	});

	// ── views ──

	await knex.raw(`
		CREATE VIEW inventory AS
		SELECT
			p.ProductId, p.CategoryId, p.SupplierId,
			pd.ProductDetailId, p.ProductName, pd.ProductDescription,
			c.CategoryName, c.CategoryDescription,
			p.ProductInStockQuantity, p.ProductPricePerUnit,
			p.ProductUnitSizeInMilliliters, p.ProductProof,
			pd.ProductImageUrl, pd.ProductSweetnessRating,
			pd.ProductDrynessRating, pd.ProductVersatilityRating,
			pd.ProductStrengthRating, p.WorkspaceId
		FROM product p
		LEFT JOIN productdetail pd ON p.ProductId = pd.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
	`);

	await knex.raw(`
		CREATE VIEW spirits AS
		SELECT
			rc.RecipeCategoryId, rc.RecipeCategoryDescription,
			rcd.RecipeCategoryDescriptionText,
			rcd.RecipeCategoryDescriptionImageUrl
		FROM recipecategory rc
		JOIN recipecategorydescription rcd ON rc.RecipeCategoryId = rcd.RecipeCategoryId
	`);

	await knex.raw(`
		CREATE VIEW basicrecipecategory AS
		SELECT
			rc.RecipeCategoryId, rcd.RecipeCategoryDescriptionText,
			rcd.RecipeCategoryDescriptionImageUrl, rc.RecipeCategoryDescription
		FROM recipecategory rc
		JOIN recipecategorydescription rcd ON rc.RecipeCategoryId = rcd.RecipeCategoryId
	`);

	await knex.raw(`
		CREATE VIEW preparationmethod AS
		SELECT DISTINCT
			rtd.RecipeTechniqueDescriptionId,
			rtd.RecipeTechniqueDescriptionText,
			rtd.RecipeTechniqueDilutionPercentage,
			rtd.RecipeTechniqueDescriptionInstructions,
			rtd.RecipeTechniqueDescriptionImageUrl
		FROM recipetechniquedescription rtd
		LEFT JOIN recipetechnique rt ON rt.RecipeTechniqueDescriptionId = rtd.RecipeTechniqueDescriptionId
	`);

	await knex.raw(`
		CREATE VIEW basicrecipe AS
		SELECT
			r.RecipeId, r.RecipeName,
			rc.RecipeCategoryId, rc.RecipeCategoryDescription,
			rd.RecipeDescription, rcd.RecipeCategoryDescriptionText,
			rtd.RecipeTechniqueDescriptionText,
			rtd.RecipeTechniqueDilutionPercentage,
			rd.RecipeDescriptionImageUrl, r.RecipeImageUrl,
			rcd.RecipeCategoryDescriptionImageUrl,
			rt.RecipeTechniqueDescriptionId,
			rd.RecipeSweetnessRating, rd.RecipeDrynessRating,
			rd.RecipeStrengthRating, rd.RecipeVersatilityRating,
			r.WorkspaceId
		FROM recipe r
		JOIN recipecategory rc ON r.RecipeCategoryId = rc.RecipeCategoryId
		JOIN recipedescription rd ON r.RecipeDescriptionId = rd.RecipeDescriptionId
		JOIN recipetechnique rt ON r.RecipeId = rt.RecipeId
		JOIN recipetechniquedescription rtd ON rt.RecipeTechniqueDescriptionId = rtd.RecipeTechniqueDescriptionId
		JOIN recipecategorydescription rcd ON rc.RecipeCategoryId = rcd.RecipeCategoryId
	`);

	await knex.raw(`
		CREATE VIEW basicrecipestep AS
		SELECT
			rs.RecipeId, rs.RecipeStepId, rs.RecipeStepDescription,
			rs.MatchMode, rs.CategoryId AS StepCategoryId,
			p.ProductName, p.ProductId, c.CategoryId, c.CategoryName,
			c.CategoryDescription, c.BaseSpiritId,
			s.SupplierName, s.SupplierDetails,
			rs.ProductIdQuantityInMilliliters, rs.ProductIdQuantityUnit,
			p.ProductInStockQuantity, p.ProductPricePerUnit,
			p.ProductUnitSizeInMilliliters, p.ProductProof,
			p.WorkspaceId,
			CASE
				WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
					CASE WHEN p.ProductInStockQuantity > 0 THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
					CASE WHEN EXISTS(
						SELECT 1 FROM product p2
						WHERE p2.CategoryId = c.CategoryId
						AND p2.ProductInStockQuantity > 0
						AND p2.WorkspaceId = p.WorkspaceId
					) THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_BASE_SPIRIT' THEN
					CASE WHEN EXISTS(
						SELECT 1 FROM product p3
						JOIN category c3 ON p3.CategoryId = c3.CategoryId
						WHERE c3.BaseSpiritId = c.BaseSpiritId
						AND c.BaseSpiritId IS NOT NULL
						AND p3.ProductInStockQuantity > 0
						AND p3.WorkspaceId = p.WorkspaceId
					) THEN 1 ELSE 0 END
				ELSE 0
			END AS EffectiveInStock
		FROM recipestep rs
		JOIN product p ON rs.ProductId = p.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		JOIN supplier s ON p.SupplierId = s.SupplierId
	`);

	await knex.raw(`
		CREATE VIEW baserecipe AS
		SELECT
			r.RecipeId AS RecipeRecipeId, r.RecipeName,
			r.RecipeCategoryId AS RecipeRecipeCategoryId,
			r.RecipeDescriptionId AS RecipeRecipeDescriptionId,
			rc.RecipeCategoryDescription,
			rc.RecipeCategoryId AS RecipeCategoryCategoryId,
			rd.RecipeDescriptionId, rd.RecipeDescription,
			rd.RecipeDescriptionImageUrl,
			rs.RecipeStepId, rs.RecipeId, rs.ProductId AS RecipeStepProductId,
			rs.ProductIdQuantityInMilliliters,
			p.ProductId, p.CategoryId AS ProductCategoryId,
			p.ProductName, p.ProductInStockQuantity,
			p.ProductPricePerUnit, p.ProductUnitSizeInMilliliters,
			p.ProductProof,
			c.CategoryId, c.CategoryName, c.CategoryDescription,
			r.WorkspaceId
		FROM recipe r
		JOIN recipecategory rc ON r.RecipeCategoryId = rc.RecipeCategoryId
		JOIN recipedescription rd ON r.RecipeDescriptionId = rd.RecipeDescriptionId
		JOIN recipestep rs ON r.RecipeId = rs.RecipeId
		JOIN product p ON rs.ProductId = p.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
	`);

	await knex.raw(`CREATE VIEW allrecipes AS SELECT * FROM baserecipe`);

	await knex.raw(`
		CREATE VIEW recipeproducts AS
		SELECT
			RecipeId, ProductId, RecipeRecipeCategoryId AS RecipeCategoryId,
			RecipeRecipeDescriptionId AS RecipeDescriptionId,
			RecipeName, RecipeDescriptionImageUrl AS RecipeImageUrl,
			RecipeCategoryDescription, CategoryId, ProductName,
			ProductProof, CategoryName, CategoryDescription,
			RecipeStepId, WorkspaceId
		FROM baserecipe
	`);

	await knex.raw(`
		CREATE VIEW categorydetailsview AS
		SELECT
			r.RecipeId, p.ProductId, rc.RecipeCategoryId,
			rd.RecipeDescriptionId, r.RecipeName, r.RecipeImageUrl,
			rc.RecipeCategoryDescription, c.CategoryId,
			p.ProductName, p.ProductProof, c.CategoryName,
			c.CategoryDescription, rs.RecipeStepId,
			rd.RecipeDescriptionImageUrl, pd.ProductImageUrl,
			rd.RecipeDescription, rcd.RecipeCategoryDescriptionText,
			r.WorkspaceId
		FROM recipestep rs
		JOIN recipe r ON rs.RecipeId = r.RecipeId
		JOIN recipecategory rc ON r.RecipeCategoryId = rc.RecipeCategoryId
		JOIN product p ON rs.ProductId = p.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		JOIN recipedescription rd ON r.RecipeDescriptionId = rd.RecipeDescriptionId
		JOIN recipecategorydescription rcd ON rc.RecipeCategoryId = rcd.RecipeCategoryId
		LEFT JOIN productdetail pd ON pd.ProductId = p.ProductId
	`);

	await knex.raw(`
		CREATE VIEW availablerecipes AS
		SELECT br.*
		FROM baserecipe br
		WHERE br.RecipeId IN (
			SELECT rs.RecipeId
			FROM recipestep rs
			JOIN product p ON rs.ProductId = p.ProductId
			JOIN category c ON p.CategoryId = c.CategoryId
			GROUP BY rs.RecipeId
			HAVING SUM(
				CASE
					WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
						CASE WHEN p.ProductInStockQuantity > 0 THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
						CASE WHEN EXISTS(
							SELECT 1 FROM product p2
							WHERE p2.CategoryId = COALESCE(rs.CategoryId, p.CategoryId)
							AND p2.ProductInStockQuantity > 0
							AND p2.WorkspaceId = p.WorkspaceId
						) THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_BASE_SPIRIT' THEN
						CASE WHEN EXISTS(
							SELECT 1 FROM product p3
							JOIN category c3 ON p3.CategoryId = c3.CategoryId
							WHERE c3.BaseSpiritId = c.BaseSpiritId
							AND c.BaseSpiritId IS NOT NULL
							AND p3.ProductInStockQuantity > 0
							AND p3.WorkspaceId = p.WorkspaceId
						) THEN 1 ELSE 0 END
					ELSE 0
				END
			) = COUNT(*)
		)
	`);
}

export async function down(knex: Knex): Promise<void> {
	// views first (order matters for dependencies)
	await knex.raw('DROP VIEW IF EXISTS availablerecipes');
	await knex.raw('DROP VIEW IF EXISTS categorydetailsview');
	await knex.raw('DROP VIEW IF EXISTS recipeproducts');
	await knex.raw('DROP VIEW IF EXISTS allrecipes');
	await knex.raw('DROP VIEW IF EXISTS baserecipe');
	await knex.raw('DROP VIEW IF EXISTS basicrecipestep');
	await knex.raw('DROP VIEW IF EXISTS basicrecipe');
	await knex.raw('DROP VIEW IF EXISTS preparationmethod');
	await knex.raw('DROP VIEW IF EXISTS basicrecipecategory');
	await knex.raw('DROP VIEW IF EXISTS spirits');
	await knex.raw('DROP VIEW IF EXISTS inventory');

	// tables in reverse dependency order
	await knex.schema.dropTableIfExists('log');
	await knex.schema.dropTableIfExists('user');
	await knex.schema.dropTableIfExists('role');
	await knex.schema.dropTableIfExists('workspacefeatured');
	await knex.schema.dropTableIfExists('recipetechnique');
	await knex.schema.dropTableIfExists('recipestep');
	await knex.schema.dropTableIfExists('recipe');
	await knex.schema.dropTableIfExists('productdetail');
	await knex.schema.dropTableIfExists('product');
	await knex.schema.dropTableIfExists('category');
	await knex.schema.dropTableIfExists('supplier');
	await knex.schema.dropTableIfExists('recipetechniquedescription');
	await knex.schema.dropTableIfExists('recipedescription');
	await knex.schema.dropTableIfExists('recipecategorydescription');
	await knex.schema.dropTableIfExists('recipecategory');
}
