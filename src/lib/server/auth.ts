import type { User } from "$lib/types";
import type { Cookies } from "@sveltejs/kit";
import { DbProvider } from "./db";
import sha256 from "crypto-js/sha256";
import { Logger } from "./logger";
const db = new DbProvider('user_t');


export function hashPassword(password: string) {
    return sha256(password).toString();
}

export async function login(
    username: string,
    password: string,
): Promise<User | null> {
    try {
        const user = Object.assign(
            {},
            await db
                .table<User>("user")
                .where("username", username)
                .andWhere("password", hashPassword(password))
                .select("userId", "username", "email")
                .first(),
        );
        if(!user?.userId) throw Error("User not found.");

        await db
          .table<User>('user')
          .update({ 
            lastActivityDate: Logger.now()
          })
          .where({ 
            username 
          });

        return user;
    } catch(error: any) {
        await Logger.info(`User ${username} attempted to sign in.`)
        console.error(error);
        return null;
    }
}

export async function authenticate(cookies: Cookies): Promise<User | null> {
    const userId = cookies.get("session_token");
    try {
        if(!userId) return null;
        const user = Object.assign(
            {},
            await db
                .table<User>("user")
                .where({ userId })
                .select("userId", "username", "email")
                .first(),
        );
        if(!user?.userId) throw Error("User not found.");
        return user;
    } catch(error: any) {
        console.error(error);
        return null;
    }
}

export async function resetPassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
  try {
    const result: any = await db
      .table('user')
      .where({ userId, password: hashPassword(oldPassword) })
          .update({
            password: hashPassword(newPassword)
          }, ['userId', 'username', 'email']);
    return result === 1;
  } catch(error: any) {
    console.error(error);
    return false;
  }
}

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
      const result = await db
        .table('user')
          .insert({
           ...user,
            password: hashPassword(password)
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
          .update(user)
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
      response = { error: 'Returned unexpected number of rows.'}
    }
  } catch(error: any) {
    console.error(error);
    response = { error: error.message || 'An error occurred.' }

  } finally {
    const refresh = await getUsers() || [];
    response = { ...response, refresh }
  }
  return response;
}