import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }): Promise<Response> => {
  cookies.delete('userToken', { path: '/' });
  return json({ message: 'Logout successful.' });
};
