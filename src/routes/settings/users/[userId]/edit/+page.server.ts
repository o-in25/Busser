import { error, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { DbProvider } from "$lib/server/db";
import { editUser } from "$lib/server/user";
import type { User } from "$lib/types/auth";
const { NOT_FOUND } = StatusCodes;
const db = new DbProvider('user_t');

const load: PageServerLoad = async ({ params }) => {
  const { userId } = params;
  if(!userId) {
    error(NOT_FOUND, {
        reason: getReasonPhrase(NOT_FOUND),
        code: NOT_FOUND,
        message: 'Could not find user.'
    });
  }

  let user = await db.table<User>('user').where({ userId }).first();
  user = Object.assign({}, user);
  return { args: user, error: null };
}


const actions = {
  default: async ({ request, params }) => {
    const { userId } = params;
    if(!userId) {
      error(NOT_FOUND, {
        reason: getReasonPhrase(NOT_FOUND),
        code: NOT_FOUND,
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