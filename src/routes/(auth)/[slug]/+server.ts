import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, url }): Promise<Response> => {
    switch(url.pathname) {
        case '/logout':
            cookies.delete('session_token', { path: '/' });
            return json({ message: 'Logout successful.' });
        default:
            return json({ message: 'Route not found!' });
    }
};

