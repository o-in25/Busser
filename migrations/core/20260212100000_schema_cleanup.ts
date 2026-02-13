import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// 1. fix CategoryName unique constraint — make it per-workspace
	await knex.schema.alterTable('category', (t) => {
		t.dropUnique(['CategoryName'], 'CategoryName_UNIQUE');
		t.unique(['CategoryName', 'WorkspaceId'], {
			indexName: 'uq_category_name_workspace',
		});
	});

	// 2. drop legacy .NET tables (user → role dependency)
	await knex.schema.dropTableIfExists('user');
	await knex.schema.dropTableIfExists('role');
	await knex.schema.dropTableIfExists('log');

	// 3. make RecipeName NOT NULL
	await knex.raw(`
		ALTER TABLE recipe
		MODIFY RecipeName varchar(255) NOT NULL
	`);

	// 4. drop redundant views
	await knex.raw('DROP VIEW IF EXISTS allrecipes');
	await knex.raw('DROP VIEW IF EXISTS recipeproducts');
}

export async function down(knex: Knex): Promise<void> {
	// 4. restore redundant views
	await knex.raw(`
		CREATE VIEW allrecipes AS SELECT * FROM baserecipe
	`);
	await knex.raw(`
		CREATE VIEW recipeproducts AS
		SELECT
			RecipeId, ProductId, RecipeRecipeCategoryId AS RecipeCategoryId,
			RecipeRecipeDescriptionId AS RecipeDescriptionId, RecipeName,
			RecipeDescriptionImageUrl AS RecipeImageUrl, RecipeCategoryDescription,
			CategoryId, ProductName, ProductProof, CategoryName, CategoryDescription,
			RecipeStepId, WorkspaceId
		FROM baserecipe
	`);

	// 3. revert RecipeName to nullable
	await knex.raw(`
		ALTER TABLE recipe
		MODIFY RecipeName varchar(255) NULL
	`);

	// 2. restore legacy tables
	await knex.schema.createTable('role', (t) => {
		t.increments('RoleId').primary();
		t.string('RoleName', 50).notNullable();
	});
	await knex.schema.createTable('user', (t) => {
		t.increments('UserId').primary();
		t.integer('RoleId').notNullable();
		t.string('Username', 50).notNullable();
		t.string('HashedPassword', 500).notNullable();
		t.foreign('RoleId', 'FK_User_Role').references('role.RoleId');
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

	// 1. revert to global CategoryName unique
	await knex.schema.alterTable('category', (t) => {
		t.dropUnique(['CategoryName', 'WorkspaceId'], 'uq_category_name_workspace');
		t.unique(['CategoryName'], { indexName: 'CategoryName_UNIQUE' });
	});
}
