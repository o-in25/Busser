import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('oauthUser', (t) => {
		t.string('provider', 20).notNullable();
		t.string('providerUserId', 255).notNullable();
		t.string('userId', 36).notNullable();
		t.datetime('createdAt').notNullable().defaultTo(knex.fn.now());

		t.primary(['provider', 'providerUserId']);
		t.index('userId', 'idx_oauthaccount_user');

		t.foreign('userId').references('user.userId').onDelete('CASCADE').onUpdate('CASCADE');
	});

	await knex.schema.alterTable('user', (t) => {
		t.tinyint('needsOnboarding').notNullable().defaultTo(0);
		t.string('password', 255).nullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('oauthUser');

	await knex.schema.alterTable('user', (t) => {
		t.dropColumn('needsOnboarding');
		t.string('password', 255).notNullable().alter();
	});
}
