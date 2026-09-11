import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('category', (t) => {
		t.string('CategoryImageUrl', 500).nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('category', (t) => {
		t.dropColumn('CategoryImageUrl');
	});
}
