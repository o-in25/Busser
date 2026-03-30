import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('recipe', (table) => {
		table.integer('SourceRecipeId').unsigned().nullable();
		table.string('SourceWorkspaceId', 64).nullable();
		table.index(['SourceRecipeId', 'SourceWorkspaceId'], 'idx_recipe_source');
	});

	// rebuild basicrecipe view with source columns
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
			r.WorkspaceId,
			r.SourceRecipeId,
			r.SourceWorkspaceId
		FROM recipe r
		JOIN recipecategory rc ON r.RecipeCategoryId = rc.RecipeCategoryId
		JOIN recipedescription rd ON r.RecipeDescriptionId = rd.RecipeDescriptionId
		JOIN recipetechnique rt ON r.RecipeId = rt.RecipeId
		JOIN recipetechniquedescription rtd ON rt.RecipeTechniqueDescriptionId = rtd.RecipeTechniqueDescriptionId
		JOIN recipecategorydescription rcd ON rc.RecipeCategoryId = rcd.RecipeCategoryId
	`);
}

export async function down(knex: Knex): Promise<void> {
	// restore basicrecipe view without source columns
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

	await knex.schema.alterTable('recipe', (table) => {
		table.dropIndex([], 'idx_recipe_source');
		table.dropColumn('SourceWorkspaceId');
		table.dropColumn('SourceRecipeId');
	});
}
