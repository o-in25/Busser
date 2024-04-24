import type { User } from "$lib/types";
import { DbProvider } from "./db";
import sha256 from 'crypto-js/sha256';
const db = new DbProvider();

export async function login(username: string, password: string): Promise<User | null>  {
    try {
        const user = await db.table<User>('Users').where({ username }).first();
        if(!user?.password || user?.password !== sha256(password).toString()) {
            throw Error('User not found.')
        }
        delete user.password;
        return user;
    } catch(error: any) {
        console.error(error.message || error);
        return null;
    }
}
