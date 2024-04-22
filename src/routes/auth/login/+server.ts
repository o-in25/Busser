import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit'
import db from '$lib/server/db';
export const GET: RequestHandler = async () => {
    return new Response().json();
};
export const POST: RequestHandler = async (data: any) => {
    await db.connect();
    return json({ name: 'yesy'});
};