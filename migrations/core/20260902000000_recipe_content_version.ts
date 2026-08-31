import type { Knex } from 'knex';

// fork divergence: ContentVersion bumps on each edit, a fork snapshots its source's version at fork time
export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('recipe', (t) => {
		t.integer('ContentVersion').notNullable().defaultTo(0);
		t.integer('SourceVersion').nullable();
	});

	// existing forks are in sync with their source (all at version 0) — snapshot so none show a false update
	await knex.raw(`
		UPDATE recipe f
		JOIN recipe s ON f.SourceRecipeId = s.RecipeId
		SET f.SourceVersion = s.ContentVersion
		WHERE f.SourceRecipeId IS NOT NULL
	`);
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('recipe', (t) => {
		t.dropColumn('SourceVersion');
		t.dropColumn('ContentVersion');
	});
}
