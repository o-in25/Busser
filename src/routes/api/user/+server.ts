import type { RequestHandler } from './$types';
import { DbProvider } from '$lib/server/db';
const db = new DbProvider();

export const GET: RequestHandler = async () => {
    return new Response();
};

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();

    console.log(body);
    return new Response();
};