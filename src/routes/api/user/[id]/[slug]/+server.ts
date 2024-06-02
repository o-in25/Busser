import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { deleteUser } from '$lib/server/auth';
export const GET: RequestHandler = async () => {
  return new Response();
};

export const DELETE: RequestHandler = async ({ params }) => {
  const { id, slug } = params;
  switch(slug) {
    case 'delete':
      let result: any = await deleteUser(id);
      if(!result.error) {
        result = { ...result, success: 'User has been deleted. '}
      }
      return json(result);
    default:
      return json({ message: 'Route not found!' });
  }
};