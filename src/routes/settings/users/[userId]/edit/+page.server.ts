import { error, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { DbProvider } from "$lib/server/db";
import { editUser, getUser, roleSelect } from "$lib/server/user";
import type { User } from "$lib/types/auth";
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { date } from "zod";
const db = new DbProvider('user_t');

const load: PageServerLoad = async ({ params }) => {
  const { userId } = params;
  if(!userId) {
    error(StatusCodes.NOT_FOUND, {
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
    return { user: queryResult.data, roles }
  }

  return error(StatusCodes.INTERNAL_SERVER_ERROR, {
    reason: getReasonPhrase(StatusCodes.NOT_FOUND),
    code: StatusCodes.NOT_FOUND,
    message: 'User not found.'
  });

}


const actions = {
  default: async ({ request, params }) => {
    const { userId } = params;
    if(!userId) {
      error(StatusCodes.NOT_FOUND, {
        reason: getReasonPhrase(StatusCodes.NOT_FOUND),
        code: StatusCodes.NOT_FOUND,
        message: 'Could not find user.'
      });
    }

    const formData = await request.formData();
    const username = formData.get('username');
    const email = formData.get('email');    
    const user = { username, email } as User
    let rows = await editUser(userId, user);

    if(!rows) {
      return {
         error: { message: 'Could not update user.' }
      };
    }
    return {
      success: { message: 'User has been updated.' }
    };
  },
} satisfies Actions;

export { load, actions }