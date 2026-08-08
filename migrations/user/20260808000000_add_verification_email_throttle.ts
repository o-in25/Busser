import type { Knex } from 'knex';

// stuff for verification email resends
export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('user', (t) => {
		t.integer('verificationEmailsSent').notNullable().defaultTo(0);
		t.datetime('verificationEmailWindowStart').nullable();
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('user', (t) => {
		t.dropColumn('verificationEmailsSent');
		t.dropColumn('verificationEmailWindowStart');
	});
}
