import type { RequestHandler } from './$types';
import { DbProvider } from '$lib/server/db';
const db = new DbProvider('user_d');

export const GET: RequestHandler = async () => {
  return new Response();
};

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  return new Response();
};