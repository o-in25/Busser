import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// add new columns to supplier table
	await knex.schema.alterTable('supplier', (table) => {
		table.string('SupplierWebsiteUrl', 512).nullable().after('SupplierDetails');
		table.string('SupplierPhone', 50).nullable().after('SupplierWebsiteUrl');
		table.string('SupplierAddress', 500).nullable().after('SupplierPhone');
		table.string('SupplierPlaceId', 255).nullable().after('SupplierAddress');
		table.string('SupplierType', 50).nullable().after('SupplierPlaceId');
		table.string('WorkspaceId', 50).nullable().after('SupplierType');
	});

	// rename seed supplier from "homemade" to "Any"
	await knex('supplier').where('SupplierId', 1).update({ SupplierName: 'Any' });

	// update inventory view to include supplier details
	await knex.raw(`
		CREATE OR REPLACE VIEW inventory AS
		SELECT
			p.ProductId,
			p.CategoryId,
			p.SupplierId,
			pd.ProductDetailId,
			p.ProductName,
			pd.ProductDescription,
			c.CategoryName,
			c.CategoryDescription,
			c.ParentCategoryId,
			pc.CategoryName AS ParentCategoryName,
			c.CategoryGroupId,
			cg.CategoryGroupName,
			p.ProductInStockQuantity,
			p.ProductPricePerUnit,
			p.ProductUnitSizeInMilliliters,
			p.ProductProof,
			pd.ProductImageUrl,
			pd.ProductSweetnessRating,
			pd.ProductDrynessRating,
			pd.ProductVersatilityRating,
			pd.ProductStrengthRating,
			s.SupplierName,
			s.SupplierAddress,
			s.SupplierWebsiteUrl,
			p.WorkspaceId
		FROM product p
		LEFT JOIN productdetail pd ON p.ProductId = pd.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		LEFT JOIN category pc ON c.ParentCategoryId = pc.CategoryId
		LEFT JOIN categorygroup cg ON c.CategoryGroupId = cg.CategoryGroupId
		LEFT JOIN supplier s ON p.SupplierId = s.SupplierId
	`);
}

export async function down(knex: Knex): Promise<void> {
	// restore inventory view without supplier details
	await knex.raw(`
		CREATE OR REPLACE VIEW inventory AS
		SELECT
			p.ProductId,
			p.CategoryId,
			p.SupplierId,
			pd.ProductDetailId,
			p.ProductName,
			pd.ProductDescription,
			c.CategoryName,
			c.CategoryDescription,
			c.ParentCategoryId,
			pc.CategoryName AS ParentCategoryName,
			c.CategoryGroupId,
			cg.CategoryGroupName,
			p.ProductInStockQuantity,
			p.ProductPricePerUnit,
			p.ProductUnitSizeInMilliliters,
			p.ProductProof,
			pd.ProductImageUrl,
			pd.ProductSweetnessRating,
			pd.ProductDrynessRating,
			pd.ProductVersatilityRating,
			pd.ProductStrengthRating,
			p.WorkspaceId
		FROM product p
		LEFT JOIN productdetail pd ON p.ProductId = pd.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		LEFT JOIN category pc ON c.ParentCategoryId = pc.CategoryId
		LEFT JOIN categorygroup cg ON c.CategoryGroupId = cg.CategoryGroupId
	`);

	// rename back
	await knex('supplier').where('SupplierId', 1).update({ SupplierName: 'homemade' });

	// drop new columns
	await knex.schema.alterTable('supplier', (table) => {
		table.dropColumn('SupplierWebsiteUrl');
		table.dropColumn('SupplierPhone');
		table.dropColumn('SupplierAddress');
		table.dropColumn('SupplierPlaceId');
		table.dropColumn('SupplierType');
		table.dropColumn('WorkspaceId');
	});
}
