/**
 * Seed reference data for user_d: log levels, roles, permissions, and role-permission mappings.
 * Idempotent — safe to run multiple times.
 *
 * NOTE: The "ws-global-catalog" shared workspace is NOT seeded here because it
 * requires a createdBy user to exist first. Create it after the first admin registers.
 */
import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
	// ── log levels ──

	await knex('loglevel')
		.insert([
			{ logLevelId: 1, level: 'DEBUG' },
			{ logLevelId: 2, level: 'INFO' },
			{ logLevelId: 3, level: 'WARNING' },
			{ logLevelId: 4, level: 'ERROR' },
			{ logLevelId: 5, level: 'CRITICAL' },
		])
		.onConflict('logLevelId')
		.ignore();

	// ── roles ──

	const roleNames = ['OWNER', 'ADMIN', 'USER', 'VIEWER'] as const;

	for (const roleName of roleNames) {
		await knex('role')
			.insert({ roleId: knex.raw('UUID()'), roleName })
			.onConflict('roleName')
			.ignore();
	}

	// ── permissions ──

	const permissionNames = [
		'view_admin',
		'edit_admin',
		'delete_admin',
		'add_category',
		'force_reset_password',
		'create_role',
	] as const;

	for (const permissionName of permissionNames) {
		await knex('permission')
			.insert({ permissionId: knex.raw('UUID()'), permissionName })
			.onConflict('permissionName')
			.ignore();
	}

	// ── look up actual IDs by name ──

	const roleRows = await knex('role').select('roleId', 'roleName');
	const permRows = await knex('permission').select('permissionId', 'permissionName');

	const roleId = Object.fromEntries(roleRows.map((r: any) => [r.roleName, r.roleId]));
	const permId = Object.fromEntries(permRows.map((p: any) => [p.permissionName, p.permissionId]));

	// ── role ↔ permission mappings ──

	const rolePermissions = [
		// OWNER: all permissions
		...permissionNames.map((p) => ({ roleId: roleId['OWNER'], permissionId: permId[p] })),

		// ADMIN: view_admin, edit_admin, delete_admin, add_category
		{ roleId: roleId['ADMIN'], permissionId: permId['view_admin'] },
		{ roleId: roleId['ADMIN'], permissionId: permId['edit_admin'] },
		{ roleId: roleId['ADMIN'], permissionId: permId['delete_admin'] },
		{ roleId: roleId['ADMIN'], permissionId: permId['add_category'] },

		// USER: add_category only
		{ roleId: roleId['USER'], permissionId: permId['add_category'] },

		// VIEWER: no permissions
	];

	await knex('rolePermission')
		.insert(rolePermissions)
		.onConflict(['roleId', 'permissionId'])
		.ignore();
}
