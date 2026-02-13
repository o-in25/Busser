import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// update inventory view to include category group and parent category
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
}

export async function down(knex: Knex): Promise<void> {
	// restore original inventory view without category group columns
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
	`);
}
