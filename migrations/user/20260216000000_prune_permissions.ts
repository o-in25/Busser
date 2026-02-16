import type { Knex } from 'knex';

// permissions being removed
const removedPermissions = [
	'view_category',
	'edit_category',
	'delete_category',
	'view_inventory',
	'edit_inventory',
	'add_inventory',
	'view_catalog',
	'edit_catalog',
	'add_catalog',
	'view_settings',
	'edit_settings',
	'add_settings',
	'delete_settings',
	'view_tools',
	'edit_tools',
	'add_tools',
	'delete_tools',
	'add_admin',
	'reset_password',
];

const OWNER_ROLE_ID = 'a1b2c3d4-0000-4000-8000-000000000001';

const newPermissions = [
	{ permissionId: 'b1c2d3e4-0000-4000-8000-000000000001', permissionName: 'force_reset_password' },
	{ permissionId: 'b1c2d3e4-0000-4000-8000-000000000002', permissionName: 'create_role' },
];

export async function up(knex: Knex): Promise<void> {
	// remove old role-permission mappings for removed permissions
	const removedIds = await knex('permission')
		.whereIn('permissionName', removedPermissions)
		.select('permissionId');

	if (removedIds.length) {
		await knex('rolePermission')
			.whereIn('permissionId', removedIds.map((r: any) => r.permissionId))
			.del();
	}

	// delete removed permissions
	await knex('permission').whereIn('permissionName', removedPermissions).del();

	// insert OWNER role
	await knex('role')
		.insert({ roleId: OWNER_ROLE_ID, roleName: 'OWNER' })
		.onConflict('roleId')
		.ignore();

	// insert new permissions
	await knex('permission').insert(newPermissions).onConflict('permissionId').ignore();

	// get all 6 remaining permission ids
	const allPermissions = await knex('permission').select('permissionId');

	// assign all permissions to OWNER
	const ownerMappings = allPermissions.map((p: any) => ({
		roleId: OWNER_ROLE_ID,
		permissionId: p.permissionId,
	}));

	await knex('rolePermission')
		.insert(ownerMappings)
		.onConflict(['roleId', 'permissionId'])
		.ignore();
}

export async function down(knex: Knex): Promise<void> {
	// remove OWNER role mappings and role
	await knex('rolePermission').where({ roleId: OWNER_ROLE_ID }).del();
	await knex('role').where({ roleId: OWNER_ROLE_ID }).del();

	// remove new permissions
	await knex('permission')
		.whereIn('permissionName', ['force_reset_password', 'create_role'])
		.del();
}
