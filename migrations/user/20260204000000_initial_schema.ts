/**
 * Baseline migration for user_d database.
 * Captures the full schema as of 2026-02-04.
 *
 * Tables: loglevel, log, role, permission, rolePermission, user, workspace,
 *         workspaceUser, userRole, invitation, invitationRequest, upload, userFavorite
 * Views:  userAccessControl
 */
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// ── reference tables (no foreign key dependencies) ──

	await knex.schema.createTable('loglevel', (t) => {
		t.increments('logLevelId').primary();
		t.string('level', 10).notNullable().unique();
	});

	await knex.schema.createTable('role', (t) => {
		t.string('roleId', 36).notNullable();
		t.string('roleName', 10).notNullable().unique();
		t.primary(['roleId', 'roleName']);
		t.unique(['roleId']);
	});

	await knex.schema.createTable('permission', (t) => {
		t.string('permissionId', 36).notNullable();
		t.string('permissionName', 45).notNullable().unique();
		t.primary(['permissionId', 'permissionName']);
		t.unique(['permissionId']);
	});

	// ── user (created without preferredWorkspaceId FK to break circular dep) ──

	await knex.schema.createTable('user', (t) => {
		t.string('userId', 36).notNullable().primary();
		t.string('email', 255).notNullable().unique();
		t.string('username', 45).notNullable().unique();
		t.string('password', 255).notNullable();
		t.datetime('lastActivityDate').nullable();
		t.tinyint('verified').notNullable().defaultTo(0);
		t.string('preferredWorkspaceId', 64).nullable();
		t.string('avatarImageUrl', 255).nullable();
		// FK for preferredWorkspaceId added after workspace table is created
	});

	// ── workspace (references user) ──

	await knex.schema.createTable('workspace', (t) => {
		t.string('workspaceId', 64).notNullable().primary();
		t.string('workspaceName', 255).notNullable();
		t.enum('workspaceType', ['personal', 'shared']).notNullable().defaultTo('personal');
		t.datetime('createdDate').notNullable().defaultTo(knex.fn.now());
		t.string('createdBy', 36).notNullable();

		t.foreign('createdBy').references('user.userId').onDelete('CASCADE');
	});

	// ── now add the circular FK from user -> workspace ──

	await knex.schema.alterTable('user', (t) => {
		t.foreign('preferredWorkspaceId', 'FK_user_preferredWorkspace')
			.references('workspace.workspaceId')
			.onDelete('SET NULL');
	});

	// ── join tables ──

	await knex.schema.createTable('userRole', (t) => {
		t.string('userId', 36).notNullable();
		t.string('roleId', 36).notNullable();
		t.primary(['userId', 'roleId']);

		t.foreign('userId').references('user.userId').onDelete('CASCADE').onUpdate('CASCADE');
		t.foreign('roleId').references('role.roleId').onDelete('CASCADE').onUpdate('CASCADE');
	});

	await knex.schema.createTable('rolePermission', (t) => {
		t.string('roleId', 36).notNullable();
		t.string('permissionId', 36).notNullable();
		t.primary(['roleId', 'permissionId']);

		t.foreign('roleId').references('role.roleId').onDelete('CASCADE').onUpdate('CASCADE');
		t.foreign('permissionId')
			.references('permission.permissionId')
			.onDelete('CASCADE')
			.onUpdate('CASCADE');
	});

	await knex.schema.createTable('workspaceUser', (t) => {
		t.string('workspaceId', 64).notNullable();
		t.string('userId', 36).notNullable();
		t.enum('workspaceRole', ['owner', 'editor', 'viewer']).notNullable().defaultTo('viewer');
		t.datetime('joinedDate').notNullable().defaultTo(knex.fn.now());
		t.primary(['workspaceId', 'userId']);

		t.foreign('workspaceId').references('workspace.workspaceId').onDelete('CASCADE');
		t.foreign('userId').references('user.userId').onDelete('CASCADE');
	});

	// ── domain tables ──

	await knex.schema.createTable('log', (t) => {
		t.increments('logId').primary();
		t.integer('logLevelId').notNullable();
		t.string('logMessage', 1000).notNullable();
		t.datetime('logDate').notNullable();
		t.string('logStackTrace', 10000).nullable();
	});

	await knex.schema.createTable('invitation', (t) => {
		t.bigIncrements('invitationId').primary();
		t.string('userId', 36).nullable();
		t.string('invitationCode', 6).nullable().unique();
		t.timestamp('createdAt').defaultTo(knex.fn.now());
		t.timestamp('issuedAt').nullable();
		t.timestamp('expiresAt').nullable();
		t.timestamp('lastSentAt').nullable();
		t.string('email', 255).nullable();
		t.string('workspaceId', 255).nullable();
		t.enum('workspaceRole', ['owner', 'editor', 'viewer']).nullable();

		t.foreign('userId').references('user.userId').onDelete('CASCADE').onUpdate('CASCADE');
		t.foreign('workspaceId', 'fk_invitation_workspace')
			.references('workspace.workspaceId')
			.onDelete('CASCADE');
	});

	await knex.schema.createTable('invitationRequest', (t) => {
		t.increments('invitationRequestId').primary();
		t.string('email', 255).notNullable();
		t.text('message').nullable();
		t.enum('status', ['pending', 'fulfilled', 'rejected']).defaultTo('pending');
		t.timestamp('createdAt').defaultTo(knex.fn.now());
		t.timestamp('resolvedAt').nullable();
		t.string('resolvedBy', 36).nullable();
	});

	await knex.schema.createTable('upload', (t) => {
		t.string('uploadId', 36).notNullable();
		t.string('externalUploadId', 255).notNullable().unique();
		t.string('publicUrl', 255).notNullable();
		t.string('name', 255).notNullable().unique();
		t.string('bucket', 45).notNullable();
		t.string('contentType', 45).notNullable();
		t.integer('size').notNullable();
		t.string('status', 15).defaultTo('ACTIVE');
		t.primary(['uploadId', 'externalUploadId']);
		t.unique(['uploadId']);
	});

	await knex.schema.createTable('userFavorite', (t) => {
		t.string('favoriteId', 36).notNullable().primary();
		t.string('userId', 36).notNullable();
		t.integer('recipeId').notNullable();
		t.string('workspaceId', 64).notNullable();
		t.datetime('createdDate').notNullable().defaultTo(knex.fn.now());
		t.unique(['userId', 'recipeId']);
		t.index('recipeId', 'fk_userfavorite_recipe');
		t.index('userId', 'idx_userfavorite_user');
		t.index('workspaceId', 'idx_userfavorite_workspace');

		t.foreign('userId').references('user.userId').onDelete('CASCADE');
		// FK to app_d.recipe is cross-database; added via raw SQL
	});

	await knex.raw(`
		ALTER TABLE userFavorite
		ADD CONSTRAINT fk_userfavorite_recipe
		FOREIGN KEY (recipeId) REFERENCES app_d.recipe(RecipeId) ON DELETE CASCADE
	`);

	// ── views ──

	await knex.raw(`
		CREATE VIEW userAccessControl AS
		SELECT
			u.userId,
			GROUP_CONCAT(DISTINCT r.roleName SEPARATOR ',') AS roles,
			GROUP_CONCAT(DISTINCT p.permissionName SEPARATOR ',') AS permissions
		FROM user u
		JOIN userRole ur ON ur.userId = u.userId
		JOIN role r ON r.roleId = ur.roleId
		JOIN rolePermission rp ON rp.roleId = ur.roleId
		JOIN permission p ON p.permissionId = rp.permissionId
		GROUP BY u.userId, u.username, u.email, u.password, u.lastActivityDate
	`);
}

export async function down(knex: Knex): Promise<void> {
	// views first
	await knex.raw('DROP VIEW IF EXISTS userAccessControl');

	// tables in reverse dependency order
	await knex.schema.dropTableIfExists('userFavorite');
	await knex.schema.dropTableIfExists('upload');
	await knex.schema.dropTableIfExists('invitationRequest');
	await knex.schema.dropTableIfExists('invitation');
	await knex.schema.dropTableIfExists('log');
	await knex.schema.dropTableIfExists('workspaceUser');
	await knex.schema.dropTableIfExists('rolePermission');
	await knex.schema.dropTableIfExists('userRole');

	// break circular FK before dropping
	await knex.schema.alterTable('user', (t) => {
		t.dropForeign('preferredWorkspaceId', 'FK_user_preferredWorkspace');
	});

	await knex.schema.dropTableIfExists('workspace');
	await knex.schema.dropTableIfExists('user');
	await knex.schema.dropTableIfExists('permission');
	await knex.schema.dropTableIfExists('role');
	await knex.schema.dropTableIfExists('loglevel');
}
