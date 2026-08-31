import type { Knex } from 'knex';

// phase 4 catalog-overlay: point forked recipe steps at the global canonical category (by name) so
// ANY_IN_CATEGORY matching resolves — phase 0 collapsed products to global but left categories behind
const GLOBAL = 'ws-global-catalog';

export async function up(knex: Knex): Promise<void> {
	await knex.raw(
		`CREATE TABLE phase4_recipestep_category_backup AS
		 SELECT rs.RecipeStepId, rs.CategoryId AS OldCategoryId
		 FROM recipestep rs
		 JOIN recipe r ON r.RecipeId = rs.RecipeId AND r.WorkspaceId <> ?
		 JOIN category wc ON wc.CategoryId = rs.CategoryId AND wc.WorkspaceId <> ?
		 JOIN category gc ON gc.WorkspaceId = ? AND gc.CategoryName = wc.CategoryName`,
		[GLOBAL, GLOBAL, GLOBAL]
	);

	await knex.raw(
		`UPDATE recipestep rs
		 JOIN recipe r ON r.RecipeId = rs.RecipeId AND r.WorkspaceId <> ?
		 JOIN category wc ON wc.CategoryId = rs.CategoryId AND wc.WorkspaceId <> ?
		 JOIN category gc ON gc.WorkspaceId = ? AND gc.CategoryName = wc.CategoryName
		 SET rs.CategoryId = gc.CategoryId`,
		[GLOBAL, GLOBAL, GLOBAL]
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw(
		`UPDATE recipestep rs
		 JOIN phase4_recipestep_category_backup b ON b.RecipeStepId = rs.RecipeStepId
		 SET rs.CategoryId = b.OldCategoryId`
	);
	await knex.schema.dropTableIfExists('phase4_recipestep_category_backup');
}
