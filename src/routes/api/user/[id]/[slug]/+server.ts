import { json } from '@sveltejs/kit';

import { hasGlobalPermission } from '$lib/server/auth';
import { deleteUser, getUsers, resendVerificationEmail } from '$lib/server/user';

import type { RequestHandler } from './$types';
export const GET: RequestHandler = async () => {
	return new Response();
};

export const POST: RequestHandler = async ({ params, locals }) => {
	const { id, slug } = params;
	switch (slug) {
		case 'resend-verification': {
			if (!hasGlobalPermission(locals.user, 'edit_admin')) {
				return json({ error: 'You do not have permission to perform this action.' });
			}

			// already rejects verified and missing users
			const result = await resendVerificationEmail(id);
			if (result.status === 'error') {
				return json({ error: result.error });
			}
			return json({ success: 'Verification email sent.' });
		}
		default:
			return json({ message: 'Route not found!' });
	}
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const { id, slug } = params;
	switch (slug) {
		case 'delete': {
			if (
				!locals.user?.permissions
					.map(({ permissionName }) => permissionName)
					.includes('delete_admin')
			) {
				const refresh = (await getUsers()) || [];
				return json({ error: 'You do not have permission to perform this action.', refresh });
			}

			if (id === locals.user.userId) {
				const refresh = (await getUsers()) || [];
				return json({ error: 'This user cannot be deleted.', refresh });
			}

			let result: any = await deleteUser(id, locals.user?.userId || '');
			if (!result.error) {
				result = { ...result, success: 'User has been deleted. ' };
			}
			return json(result);
		}
		default:
			return json({ message: 'Route not found!' });
	}
};
