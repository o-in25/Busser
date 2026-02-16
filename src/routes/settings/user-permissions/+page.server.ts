import { fail } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';

import { hasGlobalPermission } from '$lib/server/auth';
import { createRole, getGrants, roleSelect, updateGrants } from '$lib/server/user';
import type { Permission, Role } from '$lib/types/auth';

import type { Actions, PageServerLoad } from './$types';

export const load = (async ({ url, locals }) => {
	const role = url.searchParams.get('role') || '';
	const roles = await roleSelect();
	let grants: Array<Role & Permission> = [];
	if (role) {
		const queryResult = await getGrants(role);
		if ('data' in queryResult) {
			grants = queryResult.data || [];
		}
	}

	const canCreateRole = hasGlobalPermission(locals.user, 'create_role');

	return {
		roles,
		grants,
		canCreateRole,
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, url }) => {
		const roleId = url.searchParams.get('role') || '';
		if (!roleId) {
			return fail(StatusCodes.NOT_FOUND, { error: 'Role not found' });
		}
		let formData: any = await request.formData();
		const grants = JSON.parse(formData.get('formData'));
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
