import { redirect, type Handle, type RequestEvent } from '@sveltejs/kit'
import { StatusCodes } from 'http-status-codes';
const publicRoutes = ['/login', '/logout'];

export const handle: Handle = async ({ event, resolve }): Promise<Response> => {
    const { cookies, url } = event
    const slug = url.pathname;
	const session = cookies.get('session_token');
    
    if(!session && !publicRoutes.includes(slug)) {
        return redirect(StatusCodes.TEMPORARY_REDIRECT, '/login');
    }

	const response = await resolve(event);
    return response;

}