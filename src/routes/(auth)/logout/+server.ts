import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
    const { cookies } = event
    cookies.delete('session', { path: '/' })
    return json({ message: 'Logout successful.' })
};