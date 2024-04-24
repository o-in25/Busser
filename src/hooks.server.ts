import { redirect, type Handle, type RequestEvent } from '@sveltejs/kit'
import { StatusCodes } from 'http-status-codes';
import { AuthService } from '$lib/server/auth';
const authService = new AuthService();
const publicRoutes = ['/login', '/logout'];

export const handle: Handle = async ({ event, resolve }): Promise<Response> => {
    const { cookies, url } = event
    const slug = url.pathname;
	const session = cookies.get('session');
    if(!session && !publicRoutes.includes(slug)) {
        return redirect(StatusCodes.TEMPORARY_REDIRECT, '/login');
    }

	const response = await resolve(event);
    return response;

}