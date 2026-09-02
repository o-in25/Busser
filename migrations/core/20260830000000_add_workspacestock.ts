import type { Knex } from 'knex';

// phase 1 catalog-overlay: additive per-bar stock overlay, dual-written + backfilled (no reads yet)
export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('workspacestock', (t) => {
		t.string('WorkspaceId', 64).notNullable();
		t.integer('ProductId').notNullable(); // match product.ProductId (signed int)
		t.integer('Quantity').notNullable().defaultTo(0);
		t.timestamp('updatedDate').defaultTo(knex.fn.now());
		t.primary(['WorkspaceId', 'ProductId']);

		t.foreign('ProductId').references('product.ProductId').onDelete('CASCADE').onUpdate('CASCADE');
	});

	// cross-db FK to user_d.workspace, mirroring product (initial_schema)
	await knex.raw(`
		ALTER TABLE workspacestock
		ADD CONSTRAINT FK_workspacestock_workspace
		FOREIGN KEY (WorkspaceId) REFERENCES user_d.workspace(workspaceId) ON DELETE CASCADE
	`);

	// backfill: every in-stock product becomes an overlay row
	await knex.raw(`
		INSERT INTO workspacestock (WorkspaceId, ProductId, Quantity)
		SELECT WorkspaceId, ProductId, ProductInStockQuantity
		FROM product
		WHERE ProductInStockQuantity > 0
	`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('workspacestock');
}
