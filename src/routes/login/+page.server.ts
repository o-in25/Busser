import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { AuthService } from '$lib/server/auth';
const authService = new AuthService();
export const actions = {
	default: async ({ request }) => {
		const formData: any = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		try {
			const user = await authService.login(username, password);
			if(user) return { user: { username } };
			return fail(500, { error: true, username })

		} catch(e) {
			console.error(e)
			return fail(500, { error: true, username })
		}
	},
} satisfies Actions;