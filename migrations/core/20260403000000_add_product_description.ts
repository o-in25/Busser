import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// clean up orphaned table from prior failed attempt
	await knex.schema.dropTableIfExists('productdescription');

	// match product.ProductId column type exactly
	const [rows] = await knex.raw(`
		SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS
		WHERE TABLE_SCHEMA = DATABASE()
		  AND TABLE_NAME = 'product'
		  AND COLUMN_NAME = 'ProductId'
	`);
	const isUnsigned = (rows[0]?.COLUMN_TYPE || '').includes('unsigned');

	await knex.schema.createTable('productdescription', (t) => {
		t.increments('ProductDescriptionId').primary();
		const col = t.integer('ProductId').notNullable().unique();
		if (isUnsigned) col.unsigned();
		t.string('ProductDescriptionText', 1000).nullable();
		t.string('ProductDescriptionImageUrl', 1000).nullable();
		t.foreign('ProductId').references('product.ProductId').onDelete('CASCADE').onUpdate('CASCADE');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('productdescription');
}
