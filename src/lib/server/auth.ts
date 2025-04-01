import type { Cookies } from "@sveltejs/kit";
import { DbProvider } from "./db";
import sha256 from "crypto-js/sha256";
import { Logger } from "./logger";
import type { User } from "$lib/types/auth";
import jwt from "jsonwebtoken";

// fake key, move to env before 
// deploying
const JWT_SIGNING_KEY = "be096a4d98d02ef865c6fa2304479b703cfd753a68f83a1721d73ca31a192ad3a34e37b0792d9ebfc6eae09100d03e0aac25170373f4aafa61d556a6a7f9776a"
const db = new DbProvider('user_t');


export const hashPassword = (password: string) => sha256(password).toString();

// TODO
// just verify the jwt
export async function authenticate(userToken: string | undefined): Promise<User | null> {    
    try {
      if(!userToken) throw new Error('User token is invalid or expired.');
      const user = jwt.verify(userToken, JWT_SIGNING_KEY) as User;  
      return user;

    } catch(error: any) {
        console.error(error);
        return null;
    }
}


// TODO
// sign token and return the jwt instead of the user
export async function login(
  username: string,
  password: string,
): Promise<string | null> {
  try {
      const user = Object.assign(
          {},
          await db
              .table("userAccessControl")
              .where("username", username)
              .andWhere("password", hashPassword(password))
              .select("userId", "username", "email", "permissions", "roles")
              .first(),
      );
      if(!user?.userId) throw Error("User not found.");
      user.permissions = user.permissions?.split(',')
      user.roles = user.roles?.split(',');
      await db
        .table<User>('user')
        .update({ 
          lastActivityDate: Logger.now()
          // TODO: add any session data here
        })
        .where({ 
          username 
        });

      const userToken = jwt.sign(user, JWT_SIGNING_KEY, { algorithm: 'HS256'});
      return userToken;
  } catch(error: any) {
      await Logger.info(`User ${username} attempted to sign in.`)
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


