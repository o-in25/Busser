import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('supplier', (t) => {
		t.boolean('SupplierIsDefault').notNullable().defaultTo(false);
	});

	await knex('supplier')
		.where({ SupplierName: 'Any' })
		.whereNull('WorkspaceId')
		.update({ SupplierIsDefault: true });
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('supplier', (t) => {
		t.dropColumn('SupplierIsDefault');
	});
}
