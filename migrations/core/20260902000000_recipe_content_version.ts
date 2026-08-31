import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('recipe', (t) => {
		t.integer('ContentVersion').notNullable().defaultTo(0);
		t.integer('SourceVersion').nullable();
	});

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
