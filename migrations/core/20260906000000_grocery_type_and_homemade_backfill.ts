import type { Knex } from 'knex';

const HOMEMADE_PRODUCTS = [
	'Agave Syrup',
	'Cinnamon Simple Syrup',
	'Cranberry Juice',
	'Egg White',
	'Espresso',
	'Ginger Syrup',
	'Grapefruit Juice',
	'Grenadine',
	'Heavy Cream',
	'Honey Syrup',
	'Lemon Juice',
	'Lime Juice',
	'Mint',
	'Orange Flower Water',
	'Orange Juice',
	'Orgeat Syrup',
	'Pineapple Juice',
	'Raspberry Syrup',
	'Simple Syrup',
];

const GLOBAL_WORKSPACE = process.env.GLOBAL_WORKSPACE || 'ws-global-catalog';

export async function up(knex: Knex): Promise<void> {
	const exists = await knex('suppliertype').where({ SupplierTypeName: 'grocery' }).first();
	if (!exists) {
		await knex('suppliertype').insert({
			SupplierTypeName: 'grocery',
			SupplierTypeDescription: 'Grocery and convenience stores (may or may not sell alcohol)',
		});
	}
	await knex('suppliertype')
		.where({ SupplierTypeName: 'liquor_store' })
		.update({ SupplierTypeDescription: 'Age-gated (21+) liquor and bottle shops' });

	const homemade = await knex('supplier')
		.where({ SupplierName: 'Homemade' })
		.whereNull('WorkspaceId')
		.first();
	if (!homemade) return;

	await knex('product')
		.where('WorkspaceId', GLOBAL_WORKSPACE)
		.whereIn('ProductName', HOMEMADE_PRODUCTS)
		.update({ SupplierId: homemade.SupplierId });
}

export async function down(knex: Knex): Promise<void> {
	await knex('product')
		.where('WorkspaceId', GLOBAL_WORKSPACE)
		.whereIn('ProductName', HOMEMADE_PRODUCTS)
		.update({ SupplierId: 1 });

	await knex('suppliertype')
		.where({ SupplierTypeName: 'liquor_store' })
		.update({ SupplierTypeDescription: 'Liquor and bottle shops' });

	const grocery = await knex('suppliertype').where({ SupplierTypeName: 'grocery' }).first();
	if (grocery) {
		const other = await knex('suppliertype').where({ SupplierTypeName: 'other' }).first();
		await knex('supplier')
			.where('SupplierTypeId', grocery.SupplierTypeId)
			.update({ SupplierTypeId: other ? other.SupplierTypeId : null });
		await knex('suppliertype').where('SupplierTypeId', grocery.SupplierTypeId).del();
	}
}
