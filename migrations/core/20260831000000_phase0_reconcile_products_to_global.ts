import type { Knex } from 'knex';

// phase 0 catalog-overlay: collapse per-workspace product copies onto their global canonical (by name)
const GLOBAL = 'ws-global-catalog';

export async function up(knex: Knex): Promise<void> {
	// snapshot the copies we're about to drop + the steps we're about to repoint, for down()
	await knex.raw(
		`CREATE TABLE phase0_product_backup AS
		 SELECT p.* FROM product p
		 WHERE p.WorkspaceId <> ?
		 AND EXISTS (SELECT 1 FROM product g WHERE g.WorkspaceId = ? AND g.ProductName = p.ProductName)`,
		[GLOBAL, GLOBAL]
	);
	await knex.raw(
		`CREATE TABLE phase0_recipestep_backup AS
		 SELECT rs.RecipeStepId, rs.ProductId AS OldProductId
		 FROM recipestep rs
		 JOIN phase0_product_backup b ON rs.ProductId = b.ProductId`
	);

	// 1. carry stock into the overlay at the global product id (only 2 rows in practice)
	await knex.raw(
		`INSERT INTO workspacestock (WorkspaceId, ProductId, Quantity)
		 SELECT b.WorkspaceId, g.ProductId, b.ProductInStockQuantity
		 FROM phase0_product_backup b
		 JOIN product g ON g.WorkspaceId = ? AND g.ProductName = b.ProductName
		 WHERE b.ProductInStockQuantity > 0
		 ON DUPLICATE KEY UPDATE Quantity = VALUES(Quantity)`,
		[GLOBAL]
	);

	// 2. repoint recipestep refs from the copy to the global canonical id (FK is NO ACTION — must precede drop)
	await knex.raw(
		`UPDATE recipestep rs
		 JOIN phase0_product_backup b ON rs.ProductId = b.ProductId
		 JOIN product g ON g.WorkspaceId = ? AND g.ProductName = b.ProductName
		 SET rs.ProductId = g.ProductId`,
		[GLOBAL]
	);

	// 3. drop the copies — productdetail/productdescription/stale overlay rows cascade away
	await knex.raw(
		`DELETE p FROM product p JOIN phase0_product_backup b ON p.ProductId = b.ProductId`
	);
}

export async function down(knex: Knex): Promise<void> {
	// recreate the dropped product rows with their original ids
	await knex.raw(
		`INSERT INTO product
		 SELECT * FROM phase0_product_backup`
	);

	// repoint recipesteps back to the recreated copies
	await knex.raw(
		`UPDATE recipestep rs
		 JOIN phase0_recipestep_backup b ON rs.RecipeStepId = b.RecipeStepId
		 SET rs.ProductId = b.OldProductId`
	);

	// move overlay stock back off the global id onto the recreated copy id
	await knex.raw(
		`DELETE ws FROM workspacestock ws
		 JOIN phase0_product_backup b ON b.WorkspaceId = ws.WorkspaceId
		 JOIN product g ON g.WorkspaceId = ? AND g.ProductName = b.ProductName AND g.ProductId = ws.ProductId
		 WHERE b.ProductInStockQuantity > 0`,
		[GLOBAL]
	);
	await knex.raw(
		`INSERT INTO workspacestock (WorkspaceId, ProductId, Quantity)
		 SELECT WorkspaceId, ProductId, ProductInStockQuantity
		 FROM phase0_product_backup WHERE ProductInStockQuantity > 0
		 ON DUPLICATE KEY UPDATE Quantity = VALUES(Quantity)`
	);

	await knex.schema.dropTableIfExists('phase0_recipestep_backup');
	await knex.schema.dropTableIfExists('phase0_product_backup');
}
