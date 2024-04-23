import type { Handle, RequestEvent } from '@sveltejs/kit'
export const handle: Handle = async ({ event, resolve }) => {
    console.log('here');
	const response = await resolve(event);
    return response;

}