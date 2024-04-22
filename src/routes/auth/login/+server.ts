import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit'
import db from '$lib/server/db';
const mariadb = new db();

export const GET: RequestHandler = async () => {
    return new Response().json();
};
export const POST: RequestHandler = async (data: any) => {
    const connection = await mariadb.getConnection();
    const result = await connection.query('SELECT * FROM barback.Users');
    console.log(result)
    return json({ name: 'yesy'});
};