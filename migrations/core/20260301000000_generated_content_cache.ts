import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// add insights toggle to recipe table
	await knex.schema.alterTable('recipe', (table) => {
		table.boolean('InsightsEnabled').notNullable().defaultTo(true).after('RecipeImageUrl');
	});

	// create generic generated content cache table
	await knex.schema.createTable('generatedcontent', (table) => {
		table.increments('GeneratedContentId').primary();
		table.string('ContentType', 50).notNullable();
		table.integer('ReferenceId').unsigned().notNullable();
		table.json('Content').notNullable();
		table.datetime('GeneratedAt').defaultTo(knex.fn.now());
		table.string('ModelVersion', 50).defaultTo('gpt-4o-mini');
		table.unique(['ContentType', 'ReferenceId']);
	});

	// recreate basicrecipe view to include InsightsEnabled
	await knex.raw(`
		CREATE OR REPLACE VIEW basicrecipe AS
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
			r.InsightsEnabled,
			r.WorkspaceId
		FROM recipe r
		JOIN recipecategory rc ON r.RecipeCategoryId = rc.RecipeCategoryId
		JOIN recipedescription rd ON r.RecipeDescriptionId = rd.RecipeDescriptionId
		JOIN recipetechnique rt ON r.RecipeId = rt.RecipeId
		JOIN recipetechniquedescription rtd ON rt.RecipeTechniqueDescriptionId = rtd.RecipeTechniqueDescriptionId
		JOIN recipecategorydescription rcd ON rc.RecipeCategoryId = rcd.RecipeCategoryId
	`);
}

export async function down(knex: Knex): Promise<void> {
	// restore original basicrecipe view without InsightsEnabled
	await knex.raw(`
		CREATE OR REPLACE VIEW basicrecipe AS
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

	await knex.schema.dropTableIfExists('generatedcontent');
	await knex.schema.alterTable('recipe', (table) => {
		table.dropColumn('InsightsEnabled');
	});
}
