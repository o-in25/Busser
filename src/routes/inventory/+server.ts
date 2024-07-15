import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, cookies, url }): Promise<Response> => {
  console.log(request, 'huzzah')
  return json({ message: 'Route not found!' });

};

