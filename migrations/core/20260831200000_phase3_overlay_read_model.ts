import type { Knex } from 'knex';

// phase 3 catalog-overlay: availability keyed on the viewing bar's overlay (see epic doc)
const GLOBAL = 'ws-global-catalog';

// in-stock predicate for a step, parameterized by the viewing workspace alias `v`
const inStockForViewer = `
	CASE
		WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
			CASE WHEN EXISTS(
				SELECT 1 FROM workspacestock ws
				WHERE ws.WorkspaceId = v.WorkspaceId AND ws.ProductId = p.ProductId AND ws.Quantity > 0
			) THEN 1 ELSE 0 END
		WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
			CASE WHEN EXISTS(
				SELECT 1 FROM product p2
				JOIN workspacestock ws2 ON ws2.WorkspaceId = v.WorkspaceId AND ws2.ProductId = p2.ProductId AND ws2.Quantity > 0
				WHERE p2.CategoryId = COALESCE(rs.CategoryId, p.CategoryId)
			) THEN 1 ELSE 0 END
		WHEN rs.MatchMode = 'ANY_IN_PARENT_CATEGORY' THEN
			CASE WHEN EXISTS(
				SELECT 1 FROM product p4
				JOIN category c4 ON p4.CategoryId = c4.CategoryId
				JOIN workspacestock ws4 ON ws4.WorkspaceId = v.WorkspaceId AND ws4.ProductId = p4.ProductId AND ws4.Quantity > 0
				WHERE (c4.ParentCategoryId = c.ParentCategoryId OR c4.CategoryId = c.ParentCategoryId)
				AND c.ParentCategoryId IS NOT NULL
			) THEN 1 ELSE 0 END
		ELSE 0
	END`;

export async function up(knex: Knex): Promise<void> {
	// inventory: overlay-stocked products (keyed to the stocking bar) + still-owned products (house
	// items, or the global owner's catalog) that aren't already represented by an overlay row
	const cols = (qty: string, ws: string) => `
		p.ProductId, p.CategoryId, p.SupplierId, pd.ProductDetailId, p.ProductName, pd.ProductDescription,
		c.CategoryName, c.CategoryDescription, c.ParentCategoryId, pc.CategoryName AS ParentCategoryName,
		c.CategoryGroupId, cg.CategoryGroupName,
		${qty} AS ProductInStockQuantity,
		p.ProductPricePerUnit, p.ProductUnitSizeInMilliliters, p.ProductProof,
		pd.ProductImageUrl, pd.ProductSweetnessRating, pd.ProductDrynessRating,
		pd.ProductVersatilityRating, pd.ProductStrengthRating,
		s.SupplierName, s.SupplierAddress, s.SupplierWebsiteUrl,
		${ws} AS WorkspaceId`;
	const joins = `
		FROM product p
		LEFT JOIN productdetail pd ON p.ProductId = pd.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		LEFT JOIN category pc ON c.ParentCategoryId = pc.CategoryId
		LEFT JOIN categorygroup cg ON c.CategoryGroupId = cg.CategoryGroupId
		LEFT JOIN supplier s ON p.SupplierId = s.SupplierId`;
	await knex.raw(`
		CREATE OR REPLACE VIEW inventory AS
		SELECT ${cols('ws.Quantity', 'ws.WorkspaceId')}
		${joins}
		JOIN workspacestock ws ON ws.ProductId = p.ProductId
		UNION ALL
		SELECT ${cols('p.ProductInStockQuantity', 'p.WorkspaceId')}
		${joins}
		WHERE NOT EXISTS(
			SELECT 1 FROM workspacestock ws
			WHERE ws.WorkspaceId = p.WorkspaceId AND ws.ProductId = p.ProductId
		)
	`);

	// basicrecipestep: descriptive only, keyed on the recipe's workspace (availability lives elsewhere now)
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
			r.WorkspaceId
		FROM recipestep rs
		JOIN recipe r ON rs.RecipeId = r.RecipeId
		JOIN product p ON rs.ProductId = p.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		LEFT JOIN category pc ON c.ParentCategoryId = pc.CategoryId
		JOIN supplier s ON p.SupplierId = s.SupplierId
	`);

	// per-viewer step availability — replaces basicrecipestep.EffectiveInStock
	await knex.raw(`
		CREATE OR REPLACE VIEW recipestepstock AS
		SELECT v.WorkspaceId, rs.RecipeStepId, rs.RecipeId, ${inStockForViewer} AS EffectiveInStock
		FROM (SELECT DISTINCT WorkspaceId FROM workspacestock WHERE WorkspaceId <> '${GLOBAL}') v
		JOIN recipestep rs ON 1 = 1
		JOIN product p ON rs.ProductId = p.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		UNION ALL
		SELECT '${GLOBAL}', rs.RecipeStepId, rs.RecipeId, 1 FROM recipestep rs
	`);

	// per-viewer makeable recipes — every step in stock for that viewer
	await knex.raw(`
		CREATE OR REPLACE VIEW availablerecipes AS
		SELECT v.WorkspaceId, rs.RecipeId
		FROM (SELECT DISTINCT WorkspaceId FROM workspacestock WHERE WorkspaceId <> '${GLOBAL}') v
		JOIN recipestep rs ON 1 = 1
		JOIN product p ON rs.ProductId = p.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		GROUP BY v.WorkspaceId, rs.RecipeId
		HAVING SUM(${inStockForViewer}) = COUNT(*)
		UNION ALL
		SELECT '${GLOBAL}', rs.RecipeId FROM recipestep rs GROUP BY rs.RecipeId
	`);
}

// restore the phase-2 definitions
export async function down(knex: Knex): Promise<void> {
	await knex.raw('DROP VIEW IF EXISTS recipestepstock');

	await knex.raw(`
		CREATE OR REPLACE VIEW inventory AS
		SELECT
			p.ProductId, p.CategoryId, p.SupplierId, pd.ProductDetailId, p.ProductName, pd.ProductDescription,
			c.CategoryName, c.CategoryDescription, c.ParentCategoryId, pc.CategoryName AS ParentCategoryName,
			c.CategoryGroupId, cg.CategoryGroupName, p.ProductInStockQuantity, p.ProductPricePerUnit,
			p.ProductUnitSizeInMilliliters, p.ProductProof, pd.ProductImageUrl, pd.ProductSweetnessRating,
			pd.ProductDrynessRating, pd.ProductVersatilityRating, pd.ProductStrengthRating,
			s.SupplierName, s.SupplierAddress, s.SupplierWebsiteUrl, p.WorkspaceId
		FROM product p
		LEFT JOIN productdetail pd ON p.ProductId = pd.ProductId
		JOIN category c ON p.CategoryId = c.CategoryId
		LEFT JOIN category pc ON c.ParentCategoryId = pc.CategoryId
		LEFT JOIN categorygroup cg ON c.CategoryGroupId = cg.CategoryGroupId
		LEFT JOIN supplier s ON p.SupplierId = s.SupplierId
	`);

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
					CASE WHEN EXISTS(SELECT 1 FROM workspacestock ws WHERE ws.WorkspaceId = p.WorkspaceId AND ws.ProductId = p.ProductId AND ws.Quantity > 0) THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
					CASE WHEN EXISTS(SELECT 1 FROM product p2 WHERE p2.CategoryId = c.CategoryId AND p2.WorkspaceId = p.WorkspaceId AND EXISTS(SELECT 1 FROM workspacestock ws2 WHERE ws2.WorkspaceId = p2.WorkspaceId AND ws2.ProductId = p2.ProductId AND ws2.Quantity > 0)) THEN 1 ELSE 0 END
				WHEN rs.MatchMode = 'ANY_IN_PARENT_CATEGORY' THEN
					CASE WHEN EXISTS(SELECT 1 FROM product p4 JOIN category c4 ON p4.CategoryId = c4.CategoryId WHERE (c4.ParentCategoryId = c.ParentCategoryId OR c4.CategoryId = c.ParentCategoryId) AND c.ParentCategoryId IS NOT NULL AND p4.WorkspaceId = p.WorkspaceId AND EXISTS(SELECT 1 FROM workspacestock ws4 WHERE ws4.WorkspaceId = p4.WorkspaceId AND ws4.ProductId = p4.ProductId AND ws4.Quantity > 0)) THEN 1 ELSE 0 END
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
			SELECT rs.RecipeId FROM recipestep rs
			JOIN product p ON rs.ProductId = p.ProductId
			JOIN category c ON p.CategoryId = c.CategoryId
			GROUP BY rs.RecipeId
			HAVING SUM(
				CASE
					WHEN rs.MatchMode = 'EXACT_PRODUCT' THEN
						CASE WHEN EXISTS(SELECT 1 FROM workspacestock ws WHERE ws.WorkspaceId = p.WorkspaceId AND ws.ProductId = p.ProductId AND ws.Quantity > 0) THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_CATEGORY' THEN
						CASE WHEN EXISTS(SELECT 1 FROM product p2 WHERE p2.CategoryId = COALESCE(rs.CategoryId, p.CategoryId) AND p2.WorkspaceId = p.WorkspaceId AND EXISTS(SELECT 1 FROM workspacestock ws2 WHERE ws2.WorkspaceId = p2.WorkspaceId AND ws2.ProductId = p2.ProductId AND ws2.Quantity > 0)) THEN 1 ELSE 0 END
					WHEN rs.MatchMode = 'ANY_IN_PARENT_CATEGORY' THEN
						CASE WHEN EXISTS(SELECT 1 FROM product p4 JOIN category c4 ON p4.CategoryId = c4.CategoryId WHERE (c4.ParentCategoryId = c.ParentCategoryId OR c4.CategoryId = c.ParentCategoryId) AND c.ParentCategoryId IS NOT NULL AND p4.WorkspaceId = p.WorkspaceId AND EXISTS(SELECT 1 FROM workspacestock ws4 WHERE ws4.WorkspaceId = p4.WorkspaceId AND ws4.ProductId = p4.ProductId AND ws4.Quantity > 0)) THEN 1 ELSE 0 END
					ELSE 0
				END
			) = COUNT(*)
		)
	`);
}
