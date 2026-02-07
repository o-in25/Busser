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

	const roles = [
		{ roleId: 'f2687fee-0e75-11f0-9f4d-42010a400003', roleName: 'ADMIN' },
		{ roleId: 'fded2005-0e75-11f0-9f4d-42010a400003', roleName: 'USER' },
		{ roleId: '16407f9b-0e76-11f0-9f4d-42010a400003', roleName: 'VIEWER' },
	];

	await knex('role').insert(roles).onConflict('roleId').ignore();

	// ── permissions ──

	const permissions = [
		// category
		{ permissionId: '07e29cd9-0f1a-11f0-9f4d-42010a400003', permissionName: 'view_category' },
		{ permissionId: '07ec192a-0f1a-11f0-9f4d-42010a400003', permissionName: 'add_category' },
		{ permissionId: '07ec1cd5-0f1a-11f0-9f4d-42010a400003', permissionName: 'edit_category' },
		{ permissionId: '07ec1e06-0f1a-11f0-9f4d-42010a400003', permissionName: 'delete_category' },
		// inventory
		{ permissionId: '0a53b7ae-0e79-11f0-9f4d-42010a400003', permissionName: 'view_inventory' },
		{ permissionId: '0a54df2d-0e79-11f0-9f4d-42010a400003', permissionName: 'edit_inventory' },
		{ permissionId: '0a54e24f-0e79-11f0-9f4d-42010a400003', permissionName: 'add_inventory' },
		// catalog
		{ permissionId: '0a54e4a5-0e79-11f0-9f4d-42010a400003', permissionName: 'view_catalog' },
		{ permissionId: '0a54e5b5-0e79-11f0-9f4d-42010a400003', permissionName: 'edit_catalog' },
		{ permissionId: '0a54e671-0e79-11f0-9f4d-42010a400003', permissionName: 'add_catalog' },
		// settings
		{ permissionId: '0a54e8a6-0e79-11f0-9f4d-42010a400003', permissionName: 'view_settings' },
		{ permissionId: '0a54e99e-0e79-11f0-9f4d-42010a400003', permissionName: 'edit_settings' },
		{ permissionId: '0a54eb07-0e79-11f0-9f4d-42010a400003', permissionName: 'add_settings' },
		{ permissionId: '0a54ec1b-0e79-11f0-9f4d-42010a400003', permissionName: 'delete_settings' },
		// tools
		{ permissionId: '0a54ed24-0e79-11f0-9f4d-42010a400003', permissionName: 'view_tools' },
		{ permissionId: '0a54ee29-0e79-11f0-9f4d-42010a400003', permissionName: 'edit_tools' },
		{ permissionId: '0a54f06f-0e79-11f0-9f4d-42010a400003', permissionName: 'add_tools' },
		{ permissionId: '0a54f151-0e79-11f0-9f4d-42010a400003', permissionName: 'delete_tools' },
		// admin
		{ permissionId: '0a54f1d4-0e79-11f0-9f4d-42010a400003', permissionName: 'view_admin' },
		{ permissionId: '0a54f25f-0e79-11f0-9f4d-42010a400003', permissionName: 'edit_admin' },
		{ permissionId: '0a54f2d6-0e79-11f0-9f4d-42010a400003', permissionName: 'add_admin' },
		{ permissionId: '0a54f349-0e79-11f0-9f4d-42010a400003', permissionName: 'delete_admin' },
		// other
		{ permissionId: 'e98cc466-1491-11f0-9f4d-42010a400003', permissionName: 'reset_password' },
	];

	await knex('permission').insert(permissions).onConflict('permissionId').ignore();

	// ── role ↔ permission mappings ──

	const ADMIN = 'f2687fee-0e75-11f0-9f4d-42010a400003';
	const USER = 'fded2005-0e75-11f0-9f4d-42010a400003';
	const VIEWER = '16407f9b-0e76-11f0-9f4d-42010a400003';

	// Build the mapping: ADMIN gets everything, USER and VIEWER get subsets
	const rolePermissions = [
		// ── ADMIN: all permissions ──
		...permissions.map((p) => ({ roleId: ADMIN, permissionId: p.permissionId })),

		// ── USER: view + edit + add for most domains, no delete (except category), no admin ──
		{ roleId: USER, permissionId: '07e29cd9-0f1a-11f0-9f4d-42010a400003' }, // view_category
		{ roleId: USER, permissionId: '07ec192a-0f1a-11f0-9f4d-42010a400003' }, // add_category
		{ roleId: USER, permissionId: '07ec1cd5-0f1a-11f0-9f4d-42010a400003' }, // edit_category
		{ roleId: USER, permissionId: '0a54df2d-0e79-11f0-9f4d-42010a400003' }, // edit_inventory
		{ roleId: USER, permissionId: '0a54e24f-0e79-11f0-9f4d-42010a400003' }, // add_inventory
		{ roleId: USER, permissionId: '0a54e5b5-0e79-11f0-9f4d-42010a400003' }, // edit_catalog
		{ roleId: USER, permissionId: '0a54e671-0e79-11f0-9f4d-42010a400003' }, // add_catalog
		{ roleId: USER, permissionId: '0a54e99e-0e79-11f0-9f4d-42010a400003' }, // edit_settings
		{ roleId: USER, permissionId: '0a54eb07-0e79-11f0-9f4d-42010a400003' }, // add_settings
		{ roleId: USER, permissionId: '0a54ee29-0e79-11f0-9f4d-42010a400003' }, // edit_tools
		{ roleId: USER, permissionId: '0a54f06f-0e79-11f0-9f4d-42010a400003' }, // add_tools

		// ── VIEWER: view-only across domains ──
		{ roleId: VIEWER, permissionId: '07e29cd9-0f1a-11f0-9f4d-42010a400003' }, // view_category
		{ roleId: VIEWER, permissionId: '0a53b7ae-0e79-11f0-9f4d-42010a400003' }, // view_inventory
		{ roleId: VIEWER, permissionId: '0a54e4a5-0e79-11f0-9f4d-42010a400003' }, // view_catalog
		{ roleId: VIEWER, permissionId: '0a54e8a6-0e79-11f0-9f4d-42010a400003' }, // view_settings
		{ roleId: VIEWER, permissionId: '0a54ed24-0e79-11f0-9f4d-42010a400003' }, // view_tools
	];

	await knex('rolePermission')
		.insert(rolePermissions)
		.onConflict(['roleId', 'permissionId'])
		.ignore();
}
