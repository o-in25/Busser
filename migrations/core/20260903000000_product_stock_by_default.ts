import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('product', (t) => {
		t.boolean('StockByDefault').notNullable().defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('product', (t) => {
		t.dropColumn('StockByDefault');
	});
}
