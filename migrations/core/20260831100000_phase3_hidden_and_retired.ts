import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('workspacehidden', (t) => {
		t.string('WorkspaceId', 64).notNullable();
		t.integer('RecipeId').notNullable();
		t.timestamp('createdDate').defaultTo(knex.fn.now());
		t.primary(['WorkspaceId', 'RecipeId']);

		t.foreign('RecipeId').references('recipe.RecipeId').onDelete('CASCADE').onUpdate('CASCADE');
	});
	await knex.raw(`
		ALTER TABLE workspacehidden
		ADD CONSTRAINT FK_workspacehidden_workspace
		FOREIGN KEY (WorkspaceId) REFERENCES user_d.workspace(workspaceId) ON DELETE CASCADE
	`);

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
