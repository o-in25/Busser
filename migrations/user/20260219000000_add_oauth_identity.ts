import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('oauthIdentity', (t) => {
		t.increments('oauthIdentityId').primary();
		t.string('userId', 36).notNullable();
		t.string('provider', 20).notNullable();
		t.string('providerUserId', 255).notNullable();
		t.string('email', 255).nullable();
		t.datetime('createdDate').notNullable().defaultTo(knex.fn.now());
		t.datetime('lastLoginDate').nullable();

		t.unique(['provider', 'providerUserId']);
		t.index('userId', 'idx_oauthidentity_user');

		t.foreign('userId').references('user.userId').onDelete('CASCADE');
	});

	await knex.schema.alterTable('user', (t) => {
		t.string('password', 255).nullable().alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('oauthIdentity');

	await knex.schema.alterTable('user', (t) => {
		t.string('password', 255).notNullable().alter();
	});
}
