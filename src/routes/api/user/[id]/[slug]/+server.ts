import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { deleteUser, getUsers } from "$lib/server/user";
export const GET: RequestHandler = async () => {
  return new Response();
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
  const { id, slug } = params;
  switch(slug) {
    case 'delete':
      if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('admin_delete')) {
        const refresh = await getUsers() || [];
        return json({error: 'You do not have permission to perform this action.', refresh});
      }

      if(id === locals.user.userId) {
        const refresh = await getUsers() || [];
        return json({error: 'This user cannot be deleted.', refresh});
      }


      let result: any = await deleteUser(id, locals.user?.userId || '');
      if(!result.error) {
        result = { ...result, success: 'User has been deleted. '}
      }
      return json(result);
    default:
      return json({ message: 'Route not found!' });
  }
};