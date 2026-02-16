import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('user', (t) => {
		t.datetime('createdDate').nullable();
	});

	// backfill: default to lastActivityDate for existing users
	await knex.raw('UPDATE `user` SET createdDate = lastActivityDate');
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('user', (t) => {
		t.dropColumn('createdDate');
	});
}
