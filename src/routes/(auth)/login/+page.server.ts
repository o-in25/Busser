import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { login } from '$lib/server/auth';
import { StatusCodes } from 'http-status-codes'
import { dev } from '$app/environment';

export const actions = {
	login: async ({ request, cookies }) => {
		const formData: any = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if(!username || !password) {
			return fail(StatusCodes.BAD_REQUEST, { err: true } as any);
		}

		const userToken = await login(username, password);
		if(!userToken) {
			return fail(StatusCodes.BAD_REQUEST, { err: true, username } as any);
		}


    // TODO: include the permission 
    // info by signing it to a jwt and
    // decoding in in auth.js
		cookies.set('userToken', userToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: !dev,
			maxAge: 60 * 60 * 24 * 7 
		});
		
		redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	},
} satisfies Actions;