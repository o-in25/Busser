import type { Knex } from 'knex';

const GLOBAL = 'ws-global-catalog';

export async function up(knex: Knex): Promise<void> {
	await knex.raw(
		`CREATE TRIGGER trg_seal_global_workspace_update BEFORE UPDATE ON workspace FOR EACH ROW
		 BEGIN
		   IF OLD.workspaceId = '${GLOBAL}' AND NEW.workspaceId <> OLD.workspaceId THEN
		     SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'global workspace id is sealed';
		   END IF;
		 END`
	);

	await knex.raw(
		`CREATE TRIGGER trg_seal_global_workspace_delete BEFORE DELETE ON workspace FOR EACH ROW
		 BEGIN
		   IF OLD.workspaceId = '${GLOBAL}' THEN
		     SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'global workspace cannot be deleted';
		   END IF;
		 END`
	);
}

export async function down(knex: Knex): Promise<void> {
	await knex.raw(`DROP TRIGGER IF EXISTS trg_seal_global_workspace_update`);
	await knex.raw(`DROP TRIGGER IF EXISTS trg_seal_global_workspace_delete`);
}
