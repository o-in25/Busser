import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { AuthService } from '$lib/server/auth';
import { StatusCodes } from 'http-status-codes'
const authService = new AuthService();
export const actions = {
	login: async ({ request, url }) => {
		const formData: any = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		const user = await authService.login(username, password);
		if(!user) return fail(StatusCodes.UNAUTHORIZED, { error: true, username });
		redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	},
} satisfies Actions;