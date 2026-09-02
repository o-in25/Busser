import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex('supplier').insert({ SupplierName: 'Homemade', WorkspaceId: null });

	await knex.schema.alterTable('product', (t) => {
		t.dropColumn('StockByDefault');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('product', (t) => {
		t.boolean('StockByDefault').notNullable().defaultTo(false);
	});

	const homemade = await knex('supplier')
		.where({ SupplierName: 'Homemade' })
		.whereNull('WorkspaceId')
		.first();
	if (homemade) {
		await knex('product').where('SupplierId', homemade.SupplierId).update({ SupplierId: 1 });
		await knex('supplier').where('SupplierId', homemade.SupplierId).del();
	}
}
