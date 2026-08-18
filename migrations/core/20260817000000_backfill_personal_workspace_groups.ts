import type { Knex } from 'knex';

// backfills null CategoryGroupId in personal workspaces
//
// personal workspaces are partial copies of the global catalog, so the same null-group bug
// got imported: 14 categories across the demo + a personal workspace have no group, which
// breaks base/modifier role grouping (e.g. Green Chartreuse falling under Top & Garnish).
// here the problem is worse than in global — the null categories' parents are often null too
// (Amaretto -> Liqueur(null)), so "inherit from parent" alone can't fix it.
//
// the corrected global catalog is the authority: for each null-group category we copy the
// group from the global category of the same name (names are unique in global, every current
// null name has a match). a parent-inheritance pass then mops up anything global didn't cover
// (custom categories a user added). recipe/product data is untouched.
//
// defects 1 (syrup split) and 2 (Campari mis-filed) are N/A for personal workspaces: Campari
// isn't mis-filed in any of them, and the imported syrup buckets each hold a single product
// so there's nothing to cross-match — purely cosmetic, left alone.

const GLOBAL = 'ws-global-catalog';

export async function up(knex: Knex): Promise<void> {
	// snapshot every null-group category we're about to touch so down() can restore it
	if (!(await knex.schema.hasTable('group_backfill_categories'))) {
		await knex.schema.createTable('group_backfill_categories', (t) => {
			t.integer('CategoryId').unsigned().primary();
			t.string('WorkspaceId').notNullable();
			t.integer('PreviousCategoryGroupId').nullable();
		});
	}
	await knex.raw(
		`
		INSERT IGNORE INTO group_backfill_categories (CategoryId, WorkspaceId, PreviousCategoryGroupId)
		SELECT CategoryId, WorkspaceId, CategoryGroupId FROM category
		WHERE WorkspaceId <> ? AND CategoryGroupId IS NULL
	`,
		[GLOBAL]
	);

	// primary fix: copy the group from the global category of the same name
	await knex.raw(
		`
		UPDATE category c
		JOIN category g ON g.WorkspaceId = ? AND g.CategoryName = c.CategoryName
		SET c.CategoryGroupId = g.CategoryGroupId
		WHERE c.WorkspaceId <> ? AND c.CategoryGroupId IS NULL AND g.CategoryGroupId IS NOT NULL
	`,
		[GLOBAL, GLOBAL]
	);

	// fallback: anything global didn't cover inherits from its (now possibly filled) parent
	await knex.raw(
		`
		UPDATE category c
		JOIN category pc ON pc.CategoryId = c.ParentCategoryId
		SET c.CategoryGroupId = pc.CategoryGroupId
		WHERE c.WorkspaceId <> ? AND c.CategoryGroupId IS NULL AND pc.CategoryGroupId IS NOT NULL
	`,
		[GLOBAL]
	);
}

export async function down(knex: Knex): Promise<void> {
	if (!(await knex.schema.hasTable('group_backfill_categories'))) return;

	await knex.raw(`
		UPDATE category c JOIN group_backfill_categories s ON c.CategoryId = s.CategoryId
		SET c.CategoryGroupId = s.PreviousCategoryGroupId
	`);

	await knex.schema.dropTable('group_backfill_categories');
}
