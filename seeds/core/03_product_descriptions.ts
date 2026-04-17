import type { Knex } from 'knex';

const WORKSPACE = process.env.GLOBAL_WORKSPACE || 'ws-global-catalog';

export async function seed(knex: Knex): Promise<void> {
	const rows = await knex('product as p')
		.join('productdetail as pd', 'p.ProductId', 'pd.ProductId')
		.where('p.WorkspaceId', WORKSPACE)
		.whereNotNull('pd.ProductImageUrl')
		.select('p.ProductId', 'pd.ProductImageUrl', 'pd.ProductDescription');

	if (!rows.length) {
		console.log('  skip: no global workspace products with images');
		return;
	}

	const descriptions = rows.map((r: any) => ({
		ProductId: r.ProductId,
		ProductDescriptionImageUrl: r.ProductImageUrl,
		ProductDescriptionText: r.ProductDescription || null,
	}));

	await knex('productdescription')
		.insert(descriptions)
		.onConflict('ProductId')
		.merge();

	console.log(`  ${descriptions.length} product descriptions seeded`);
}
