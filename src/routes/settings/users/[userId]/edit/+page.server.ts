import { error, fail, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { DbProvider } from "$lib/server/db";
import { editUser, getUser, roleSelect } from "$lib/server/user";
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
const db = new DbProvider('user_t');


const load: PageServerLoad = async ({ params, locals }) => {
  const { userId } = params;
  if(
    (!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_admin')) &&
    (userId?.length && userId !== locals.user?.userId)
  ) {
    return error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to access this resource.'
    });
  }
  if(!userId) {
    return error(StatusCodes.NOT_FOUND, {
      reason: getReasonPhrase(StatusCodes.NOT_FOUND),
      code: StatusCodes.NOT_FOUND,
      message: 'User not found.'
    });
  }

  // let user = await db.table<User>('user').where({ userId }).first();
  // user = Object.assign({}, user);
  const queryResult = await getUser(userId);
  const roles = await roleSelect();
  if('data' in queryResult) {
    return { user: queryResult.data, roles, currentUser: locals.user?.userId };
  }

  return error(StatusCodes.INTERNAL_SERVER_ERROR, {
    reason: getReasonPhrase(StatusCodes.NOT_FOUND),
    code: StatusCodes.NOT_FOUND,
    message: 'User not found.'
  });

};


const actions = {
  default: async ({ request, params, locals }) => {
    const { userId } = params;
    const formData = await request.formData();
    const username = formData.get('username')?.toString() || '';
    const email = formData.get('email')?.toString() || '';
    const roles = formData.get('roles')?.toString() || '';
    if(
      (!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_admin')) &&
      (userId?.length && userId !== locals.user?.userId)
    ) {
      return fail(StatusCodes.UNAUTHORIZED, {
        status: getReasonPhrase(StatusCodes.UNAUTHORIZED),
        error: 'You do not have permission to perform this action.'
      });
    }

    if(!userId) {
      return fail(StatusCodes.UNAUTHORIZED, {
        status: getReasonPhrase(StatusCodes.UNAUTHORIZED),
        error: 'User not found.'
      });
    }

    let roleIds: string[] = [];
    if(locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_admin')) {
      roleIds = roles?.split(',') || [];
    }

    const queryResult = await editUser(userId, username, email, roleIds);
    if('data' in queryResult) {
      return {
        user: queryResult.data
      };
    }
  },
} satisfies Actions;

export { load, actions };