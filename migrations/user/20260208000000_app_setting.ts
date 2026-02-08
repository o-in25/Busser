import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('appSetting', (t) => {
		t.string('settingKey', 100).notNullable().primary();
		t.string('settingValue', 500).nullable();
	});

	// default: invite-only mode is on
	await knex('appSetting').insert({ settingKey: 'invite_only_mode', settingValue: 'true' });
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists('appSetting');
}
