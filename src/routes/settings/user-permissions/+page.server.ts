import { fail } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { hasGlobalPermission } from '$lib/server/auth';
import { createRole, getGrants, roleSelect, updateGrants } from '$lib/server/user';
import type { Permission, Role } from '$lib/types/auth';

import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
	const roles = await roleSelect();
	let allGrants: Array<Role & Permission> = [];
	const queryResult = await getGrants();
	if ('data' in queryResult) {
		allGrants = queryResult.data || [];
	}

	const canCreateRole = hasGlobalPermission(locals.user, 'create_role');

	return {
		roles,
		allGrants,
		canCreateRole,
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const roleId = formData.get('roleId')?.toString() || '';
		if (!roleId) {
			return fail(StatusCodes.NOT_FOUND, { error: 'Role not found' });
		}
		const grants = JSON.parse(formData.get('formData')?.toString() || '[]');
		const permissions = grants.map(({ permissionName, permissionId }: Permission) => ({
			permissionName,
			permissionId,
		}));

		await updateGrants(roleId, permissions);
	},

	createRole: async ({ request, locals }) => {
		if (!hasGlobalPermission(locals.user, 'create_role')) {
			return fail(StatusCodes.FORBIDDEN, { error: 'You do not have permission to create roles.' });
		}

		const formData = await request.formData();
		const roleName = formData.get('roleName')?.toString().trim().toUpperCase() || '';

		if (!roleName) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Role name is required.' });
		}

		if (roleName.length > 10) {
			return fail(StatusCodes.BAD_REQUEST, { error: 'Role name must be 10 characters or less.' });
		}

		if (!/^[A-Z_]+$/.test(roleName)) {
			return fail(StatusCodes.BAD_REQUEST, {
				error: 'Role name must contain only uppercase letters and underscores.',
			});
		}

		const result = await createRole(roleName);
		if (result.status === 'error') {
			return fail(StatusCodes.CONFLICT, { error: result.error });
		}

		return { roleCreated: true, roleName };
	},
};
