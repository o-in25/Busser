import type { Knex } from 'knex';

const GLOBAL = 'ws-global-catalog';

export async function up(knex: Knex): Promise<void> {
	await knex.raw(
		`CREATE TRIGGER trg_seal_global_workspace_members BEFORE INSERT ON workspaceUser FOR EACH ROW
		 BEGIN
		   IF NEW.workspaceId = '${GLOBAL}' AND NEW.workspaceRole <> 'viewer' THEN
		     SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'global workspace only takes viewers';
		   END IF;
		 END`
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw(`DROP TRIGGER IF EXISTS trg_seal_global_workspace_members`);
}
