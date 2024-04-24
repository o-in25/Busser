import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { AuthService } from '$lib/server/auth';
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import type { CookieParseOptions } from 'cookie';
import type { Result } from '$lib/types/result';
import type { Session } from '$lib/types/session';

const authService = new AuthService();
export const actions = {
	login: async ({ request, cookies }) => {
		const formData: any = await request.formData();
		const username = formData.get('username');
		const password = formData.get('password');
		const response: Result<any> = {
			data: { username }
		};

		if(!username || !password) {
			response.error = { 
				type: StatusCodes.UNAUTHORIZED,
				message: ReasonPhrases.UNAUTHORIZED
			}
			return fail(response.error.type as number, response);
		}

		const session = await authService.login(username, password);
		if(!session) {
			response.error = { 
				type: StatusCodes.INTERNAL_SERVER_ERROR,
				message: ReasonPhrases.INTERNAL_SERVER_ERROR
			}	
			return fail(response.error.type as number, response);	
		}

		if(!session.userId) {
			response.error = { 
				type: StatusCodes.UNAUTHORIZED,
				message: ReasonPhrases.UNAUTHORIZED
			}	
			return fail(response.error.type as number, response);	
		}

		cookies.set('session', session.userId, { ...session.opts });
		redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
	},
} satisfies Actions;