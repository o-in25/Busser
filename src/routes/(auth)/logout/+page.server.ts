import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		cookies.delete('userToken', { path: '/' });
		cookies.delete('activeWorkspaceId', { path: '/' });

		return { success: true };
	},
};
