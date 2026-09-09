import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.raw(`
		CREATE TABLE fix_unsatisfiable_category_backup AS
		SELECT rs.RecipeStepId, rs.CategoryId AS OldCategoryId
		FROM recipestep rs
		JOIN product p ON p.ProductId = rs.ProductId
		WHERE rs.MatchMode = 'ANY_IN_CATEGORY'
		  AND rs.CategoryId IS NOT NULL
		  AND rs.CategoryId <> p.CategoryId
		  AND NOT EXISTS (SELECT 1 FROM product px WHERE px.CategoryId = rs.CategoryId)
	`);

	await knex.raw(`
		UPDATE recipestep rs
		JOIN product p ON p.ProductId = rs.ProductId
		SET rs.CategoryId = p.CategoryId
		WHERE rs.MatchMode = 'ANY_IN_CATEGORY'
		  AND rs.CategoryId IS NOT NULL
		  AND rs.CategoryId <> p.CategoryId
		  AND NOT EXISTS (SELECT 1 FROM product px WHERE px.CategoryId = rs.CategoryId)
	`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw(`
		UPDATE recipestep rs
		JOIN fix_unsatisfiable_category_backup b ON rs.RecipeStepId = b.RecipeStepId
		SET rs.CategoryId = b.OldCategoryId
	`);
	await knex.schema.dropTableIfExists('fix_unsatisfiable_category_backup');
}
