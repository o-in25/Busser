import type { Knex } from 'knex';

const GLOBAL = 'ws-global-catalog';

// trims stray/collapsible whitespace off global product names (e.g. " Ginger Beer").
// safe: recipes/stock reference products by id, not name.
export async function up(knex: Knex): Promise<void> {
	await knex.raw(
		`CREATE TABLE trim_global_names_backup AS
		 SELECT ProductId, ProductName AS OldName FROM product
		 WHERE WorkspaceId = ?
		 AND ProductName <> TRIM(REGEXP_REPLACE(ProductName, '\\\\s+', ' '))`,
		[GLOBAL]
	);

	await knex.raw(
		`UPDATE product SET ProductName = TRIM(REGEXP_REPLACE(ProductName, '\\\\s+', ' '))
		 WHERE WorkspaceId = ?
		 AND ProductName <> TRIM(REGEXP_REPLACE(ProductName, '\\\\s+', ' '))`,
		[GLOBAL]
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw(
		`UPDATE product p JOIN trim_global_names_backup b ON p.ProductId = b.ProductId
		 SET p.ProductName = b.OldName`
	);
	await knex.schema.dropTableIfExists('trim_global_names_backup');
}
