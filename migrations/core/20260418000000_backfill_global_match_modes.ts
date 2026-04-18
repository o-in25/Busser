import type { Knex } from 'knex';

// backfill EXACT_PRODUCT recipe steps in the global workspace so every global
// recipe is import-eligible. promotes to ANY_IN_PARENT_CATEGORY when the
// step's product category has a parent, otherwise ANY_IN_CATEGORY. original
// mode is snapshotted into recipestep_match_mode_backfill so down() can revert.

const GLOBAL_WORKSPACE = 'ws-global-catalog';

export async function up(knex: Knex): Promise<void> {
	const workspaceId = GLOBAL_WORKSPACE;

	// snapshot table for reversibility
	const hasSnapshot = await knex.schema.hasTable('recipestep_match_mode_backfill');
	if (!hasSnapshot) {
		await knex.schema.createTable('recipestep_match_mode_backfill', (t) => {
			t.integer('RecipeStepId').unsigned().primary();
			t.string('PreviousMatchMode', 32).notNullable();
			t.string('WorkspaceId', 64).notNullable();
			t.timestamp('BackfilledAt').defaultTo(knex.fn.now());
		});
	}

	// capture rows we are about to change
	await knex.raw(
		`
		INSERT IGNORE INTO recipestep_match_mode_backfill (RecipeStepId, PreviousMatchMode, WorkspaceId)
		SELECT rs.RecipeStepId, rs.MatchMode, r.WorkspaceId
		FROM recipestep rs
		JOIN recipe r ON rs.RecipeId = r.RecipeId
		WHERE r.WorkspaceId = ?
		  AND rs.MatchMode = 'EXACT_PRODUCT'
	`,
		[workspaceId]
	);

	// apply the backfill
	await knex.raw(
		`
		UPDATE recipestep rs
		JOIN recipe r   ON rs.RecipeId = r.RecipeId
		JOIN product p  ON rs.ProductId = p.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		SET rs.MatchMode = CASE
			WHEN c.ParentCategoryId IS NOT NULL THEN 'ANY_IN_PARENT_CATEGORY'
			ELSE 'ANY_IN_CATEGORY'
		END
		WHERE r.WorkspaceId = ?
		  AND rs.MatchMode = 'EXACT_PRODUCT'
	`,
		[workspaceId]
	);
}

export async function down(knex: Knex): Promise<void> {
	const hasSnapshot = await knex.schema.hasTable('recipestep_match_mode_backfill');
	if (!hasSnapshot) return;

	// restore previous modes from snapshot
	await knex.raw(`
		UPDATE recipestep rs
		JOIN recipestep_match_mode_backfill b ON rs.RecipeStepId = b.RecipeStepId
		SET rs.MatchMode = b.PreviousMatchMode
	`);

	await knex.schema.dropTable('recipestep_match_mode_backfill');
}
