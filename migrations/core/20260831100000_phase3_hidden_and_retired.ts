import type { Knex } from 'knex';

// phase 3 catalog-overlay: per-bar hide tombstones + soft-delete for global catalog rows
const GLOBAL = 'ws-global-catalog';

export async function up(knex: Knex): Promise<void> {
	// a bar can hide a global recipe from its own union without touching the shared row
	await knex.schema.createTable('workspacehidden', (t) => {
		t.string('WorkspaceId', 64).notNullable();
		t.integer('RecipeId').notNullable(); // signed to match recipe.RecipeId
		t.timestamp('createdDate').defaultTo(knex.fn.now());
		t.primary(['WorkspaceId', 'RecipeId']);

		t.foreign('RecipeId').references('recipe.RecipeId').onDelete('CASCADE').onUpdate('CASCADE');
	});
	await knex.raw(`
		ALTER TABLE workspacehidden
		ADD CONSTRAINT FK_workspacehidden_workspace
		FOREIGN KEY (WorkspaceId) REFERENCES user_d.workspace(workspaceId) ON DELETE CASCADE
	`);

	// global rows never hard-delete once bars reference them — retire instead
	await knex.schema.alterTable('product', (t) => {
		t.boolean('Retired').notNullable().defaultTo(false);
	});
	await knex.schema.alterTable('recipe', (t) => {
		t.boolean('Retired').notNullable().defaultTo(false);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('recipe', (t) => t.dropColumn('Retired'));
	await knex.schema.alterTable('product', (t) => t.dropColumn('Retired'));
	await knex.schema.dropTableIfExists('workspacehidden');
}
