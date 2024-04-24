import type { Handle, RequestEvent } from '@sveltejs/kit'
export const handle: Handle = async ({ event, resolve }) => {
    const { cookies } = event;
    console.log(cookies.get('visited'));
	const response = await resolve(event);
    return response;

}