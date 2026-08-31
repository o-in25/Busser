import type { Knex } from 'knex';

// phase 2 catalog-overlay: derive availability from the workspacestock overlay, not product.ProductInStockQuantity
export async function up(knex: Knex): Promise<void> {
	await knex.raw(`
		CREATE OR REPLACE VIEW basicrecipestep AS
		SELECT
			rs.RecipeId, rs.RecipeStepId, rs.RecipeStepDescription,
			rs.MatchMode, rs.CategoryId AS StepCategoryId,
			p.ProductName, p.ProductId, c.CategoryId, c.CategoryName,
			c.CategoryDescription, c.ParentCategoryId,
			pc.CategoryName AS ParentCategoryName,
			s.SupplierName, s.SupplierDetails,
			rs.ProductIdQuantityInMilliliters, rs.ProductIdQuantityUnit,
			p.ProductInStockQuantity, p.ProductPricePerUnit,
			p.ProductUnitSizeInMilliliters, p.ProductProof,
			p.WorkspaceId,
			CASE
				WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
					CASE WHEN EXISTS(
						SELECT 1 FROM workspacestock ws
						WHERE ws.WorkspaceId = p.WorkspaceId
						AND ws.ProductId = p.ProductId
						AND ws.Quantity > 0
					) THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
					CASE WHEN EXISTS(
						SELECT 1 FROM product p2
						WHERE p2.CategoryId = c.CategoryId
						AND p2.WorkspaceId = p.WorkspaceId
						AND EXISTS(
							SELECT 1 FROM workspacestock ws2
							WHERE ws2.WorkspaceId = p2.WorkspaceId
							AND ws2.ProductId = p2.ProductId
							AND ws2.Quantity > 0
						)
					) THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_PARENT_CATEGORY' THEN
					CASE WHEN EXISTS(
						SELECT 1 FROM product p4
						JOIN category c4 ON p4.CategoryId = c4.CategoryId
						WHERE (c4.ParentCategoryId = c.ParentCategoryId
						       OR c4.CategoryId = c.ParentCategoryId)
						AND c.ParentCategoryId IS NOT NULL
						AND p4.WorkspaceId = p.WorkspaceId
						AND EXISTS(
							SELECT 1 FROM workspacestock ws4
							WHERE ws4.WorkspaceId = p4.WorkspaceId
							AND ws4.ProductId = p4.ProductId
							AND ws4.Quantity > 0
						)
					) THEN 1 ELSE 0 END
				ELSE 0
			END AS EffectiveInStock
		FROM recipestep rs
		JOIN product p ON rs.ProductId = p.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		LEFT JOIN category pc ON c.ParentCategoryId = pc.CategoryId
		JOIN supplier s ON p.SupplierId = s.SupplierId
	`);

	await knex.raw(`
		CREATE OR REPLACE VIEW availablerecipes AS
		SELECT br.*
		FROM baserecipe br
		WHERE br.RecipeId IN (
			SELECT rs.RecipeId
			FROM recipestep rs
			JOIN product p ON rs.ProductId = p.ProductId
			JOIN category c ON p.CategoryId = c.CategoryId
			GROUP BY rs.RecipeId
			HAVING SUM(
				CASE
					WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
						CASE WHEN EXISTS(
							SELECT 1 FROM workspacestock ws
							WHERE ws.WorkspaceId = p.WorkspaceId
							AND ws.ProductId = p.ProductId
							AND ws.Quantity > 0
						) THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
						CASE WHEN EXISTS(
							SELECT 1 FROM product p2
							WHERE p2.CategoryId = COALESCE(rs.CategoryId, p.CategoryId)
							AND p2.WorkspaceId = p.WorkspaceId
							AND EXISTS(
								SELECT 1 FROM workspacestock ws2
								WHERE ws2.WorkspaceId = p2.WorkspaceId
								AND ws2.ProductId = p2.ProductId
								AND ws2.Quantity > 0
							)
						) THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_PARENT_CATEGORY' THEN
						CASE WHEN EXISTS(
							SELECT 1 FROM product p4
							JOIN category c4 ON p4.CategoryId = c4.CategoryId
							WHERE (c4.ParentCategoryId = c.ParentCategoryId
							       OR c4.CategoryId = c.ParentCategoryId)
							AND c.ParentCategoryId IS NOT NULL
							AND p4.WorkspaceId = p.WorkspaceId
							AND EXISTS(
								SELECT 1 FROM workspacestock ws4
								WHERE ws4.WorkspaceId = p4.WorkspaceId
								AND ws4.ProductId = p4.ProductId
								AND ws4.Quantity > 0
							)
						) THEN 1 ELSE 0 END
					ELSE 0
				END
			) = COUNT(*)
		)
	`);
}

// restore the product-column definitions from 20260204100000_parent_category_matching
export async function down(knex: Knex): Promise<void> {
	await knex.raw(`
		CREATE OR REPLACE VIEW basicrecipestep AS
		SELECT
			rs.RecipeId, rs.RecipeStepId, rs.RecipeStepDescription,
			rs.MatchMode, rs.CategoryId AS StepCategoryId,
			p.ProductName, p.ProductId, c.CategoryId, c.CategoryName,
			c.CategoryDescription, c.ParentCategoryId,
			pc.CategoryName AS ParentCategoryName,
			s.SupplierName, s.SupplierDetails,
			rs.ProductIdQuantityInMilliliters, rs.ProductIdQuantityUnit,
			p.ProductInStockQuantity, p.ProductPricePerUnit,
			p.ProductUnitSizeInMilliliters, p.ProductProof,
			p.WorkspaceId,
			CASE
				WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
					CASE WHEN p.ProductInStockQuantity > 0 THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
					CASE WHEN EXISTS(
						SELECT 1 FROM product p2
						WHERE p2.CategoryId = c.CategoryId
						AND p2.ProductInStockQuantity > 0
						AND p2.WorkspaceId = p.WorkspaceId
					) THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_PARENT_CATEGORY' THEN
					CASE WHEN EXISTS(
						SELECT 1 FROM product p4
						JOIN category c4 ON p4.CategoryId = c4.CategoryId
						WHERE (c4.ParentCategoryId = c.ParentCategoryId
						       OR c4.CategoryId = c.ParentCategoryId)
						AND c.ParentCategoryId IS NOT NULL
						AND p4.ProductInStockQuantity > 0
						AND p4.WorkspaceId = p.WorkspaceId
					) THEN 1 ELSE 0 END
				ELSE 0
			END AS EffectiveInStock
		FROM recipestep rs
		JOIN product p ON rs.ProductId = p.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		LEFT JOIN category pc ON c.ParentCategoryId = pc.CategoryId
		JOIN supplier s ON p.SupplierId = s.SupplierId
	`);

	await knex.raw(`
		CREATE OR REPLACE VIEW availablerecipes AS
		SELECT br.*
		FROM baserecipe br
		WHERE br.RecipeId IN (
			SELECT rs.RecipeId
			FROM recipestep rs
			JOIN product p ON rs.ProductId = p.ProductId
			JOIN category c ON p.CategoryId = c.CategoryId
			GROUP BY rs.RecipeId
			HAVING SUM(
				CASE
					WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
						CASE WHEN p.ProductInStockQuantity > 0 THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
						CASE WHEN EXISTS(
							SELECT 1 FROM product p2
							WHERE p2.CategoryId = COALESCE(rs.CategoryId, p.CategoryId)
							AND p2.ProductInStockQuantity > 0
							AND p2.WorkspaceId = p.WorkspaceId
						) THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_PARENT_CATEGORY' THEN
						CASE WHEN EXISTS(
							SELECT 1 FROM product p4
							JOIN category c4 ON p4.CategoryId = c4.CategoryId
							WHERE (c4.ParentCategoryId = c.ParentCategoryId
							       OR c4.CategoryId = c.ParentCategoryId)
							AND c.ParentCategoryId IS NOT NULL
							AND p4.ProductInStockQuantity > 0
							AND p4.WorkspaceId = p.WorkspaceId
						) THEN 1 ELSE 0 END
					ELSE 0
				END
			) = COUNT(*)
		)
	`);
}
