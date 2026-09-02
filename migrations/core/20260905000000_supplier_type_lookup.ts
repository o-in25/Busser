import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('suppliertype', (t) => {
		t.increments('SupplierTypeId').primary();
		t.string('SupplierTypeName', 255).notNullable().unique();
		t.string('SupplierTypeDescription', 1000).nullable();
	});

	await knex('suppliertype').insert([
		{
			SupplierTypeName: 'homemade',
			SupplierTypeDescription: 'Made in-house — syrups, juices, cordials, infusions',
		},
		{ SupplierTypeName: 'liquor_store', SupplierTypeDescription: 'Liquor and bottle shops' },
		{ SupplierTypeName: 'other', SupplierTypeDescription: 'Anything else' },
	]);

	await knex.schema.alterTable('supplier', (t) => {
		t.integer('SupplierTypeId').unsigned().nullable().after('SupplierType');
		t.foreign('SupplierTypeId', 'fk_supplier_suppliertype')
			.references('SupplierTypeId')
			.inTable('suppliertype');
	});

	const typeId = async (name: string): Promise<number> => {
		const row = await knex('suppliertype').where({ SupplierTypeName: name }).first();
		return row.SupplierTypeId;
	};
	const otherId = await typeId('other');

	// backfill old values
	const suppliers = await knex('supplier').select('SupplierId', 'SupplierType');
	for (const s of suppliers) {
		const match = await knex('suppliertype')
			.where({ SupplierTypeName: (s.SupplierType || '').toLowerCase() })
			.first();
		await knex('supplier')
			.where({ SupplierId: s.SupplierId })
			.update({ SupplierTypeId: match ? match.SupplierTypeId : otherId });
	}

	await knex('supplier')
		.where({ SupplierName: 'Homemade' })
		.whereNull('WorkspaceId')
		.update({ SupplierTypeId: await typeId('homemade') });

	await knex.schema.alterTable('supplier', (t) => {
		t.dropColumn('SupplierType');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('supplier', (t) => {
		t.string('SupplierType', 50).nullable().after('SupplierPlaceId');
	});

	const rows = await knex('supplier as s')
		.leftJoin('suppliertype as st', 's.SupplierTypeId', 'st.SupplierTypeId')
		.select('s.SupplierId', 'st.SupplierTypeName');
	for (const r of rows) {
		await knex('supplier')
			.where({ SupplierId: r.SupplierId })
			.update({ SupplierType: r.SupplierTypeName || null });
	}

	await knex.schema.alterTable('supplier', (t) => {
		t.dropForeign([], 'fk_supplier_suppliertype');
		t.dropColumn('SupplierTypeId');
	});

	await knex.schema.dropTableIfExists('suppliertype');
}
