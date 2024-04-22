import type { RequestHandler } from './$types';
import { error, json } from '@sveltejs/kit'

export const GET: RequestHandler = async () => {
    return json({});
};
export const POST: RequestHandler = async (data: any) => {
    return json({});
};