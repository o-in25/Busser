import type { User } from "$lib/types/auth";
import { hashPassword } from "./auth";
import { DbProvider } from "./db";

const db = new DbProvider('user_t');

export async function getUsers() {
  try {
    let users = await db.table<User>('user');
    users = users.map(user => Object.assign({}, user));
    return users;
  } catch(error: any) {
    console.error(error);
    return [];
  }
}

export async function addUser(user: User, password: string) {
  try {
    const hashedPassword = await hashPassword(password);
    const result = await db
      .table('user')
      .insert({
        ...user,
        password: hashedPassword
      });
    return { rows: result?.length || 0 };
  } catch(error) {
    console.error(error);
    return null;
  }
}

export async function editUser(userId: string, user: User) {
  try {
    const result = await db
      .table('user')
      .where({ userId })
      .update(user);
    return result;
  } catch(error) {
    console.error(error);
    return null;
  }
}

export async function deleteUser(userId: string) {
  let response = {};
  try {
    const result = await db
      .table('user')
      .where({ userId })
      .del();
    if(result !== 1) {
      response = { error: 'Returned unexpected number of rows.' };
    }
  } catch(error: any) {
    console.error(error);
    response = { error: error.message || 'An error occurred.' };

  } finally {
    const refresh = await getUsers() || [];
    response = { ...response, refresh };
  }
  return response;
}
