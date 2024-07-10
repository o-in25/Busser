import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { login } from '$lib/server/auth';
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import { dev } from '$app/environment';
import { MongoProvider } from '$lib/server/mongo';
export const actions = {
	login: async ({ request, cookies }) => {

    const db = await MongoProvider.connectTo('Guava')
    console.log(db)
    return fail(StatusCodes.BAD_REQUEST, { err: true } as any);

		const formData: any = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');

		if(!username || !password) {
			return fail(StatusCodes.BAD_REQUEST, { err: true } as any);
		}

		const { userId } = await login(username, password) || {};
		if(!userId) {
			return fail(StatusCodes.BAD_REQUEST, { err: true, username } as any);
		}

		// cookies.set('session_token', userId, {
		// 	path: '/',
		// 	httpOnly: true,
		// 	sameSite: 'strict',
		// 	secure: !dev,
		// 	maxAge: 60 * 60 * 24 * 7 
		// });
		
		redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	},
} satisfies Actions;