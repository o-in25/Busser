import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { login } from '$lib/server/auth';
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import { dev } from '$app/environment';
import type { User } from '$lib/types';
import { addUser } from '$lib/server/user';
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient();
export const actions = {
	login: async ({ request, cookies }) => {

    const rres = await prisma.user.create({ data: {
        username: 'eoin',
        email: 'NAME@test.com',
        password: '234234'
    }})

    console.log(rres)
    // await addUser({
    //   username: 'eoin',
    //   email: 'NAME@test.com',
    // } as User, '123')
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