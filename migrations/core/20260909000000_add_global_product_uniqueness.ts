import type { Knex } from 'knex';

const GLOBAL = 'ws-global-catalog';

export async function up(knex: Knex): Promise<void> {
	await knex.raw(
		`ALTER TABLE product
		 ADD COLUMN ProductNormalizedName VARCHAR(255) COLLATE utf8mb4_unicode_ci
		 GENERATED ALWAYS AS (
		   CASE WHEN WorkspaceId = ?
		     THEN TRIM(REGEXP_REPLACE(REGEXP_REPLACE(ProductName, '[^\\\\p{L}\\\\p{N}]+', ' '), '\\\\s+', ' '))
		     ELSE NULL
		   END
		 ) VIRTUAL`,
		[GLOBAL]
	);

	// self-guards: fails loudly if the catalog already holds a normalized-name dup.
	await knex.raw(`CREATE UNIQUE INDEX ux_product_global_norm ON product (ProductNormalizedName)`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw(`DROP INDEX ux_product_global_norm ON product`);
	await knex.raw(`ALTER TABLE product DROP COLUMN ProductNormalizedName`);
}
