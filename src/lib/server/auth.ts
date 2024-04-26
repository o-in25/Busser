import type { User } from "$lib/types";
import type { Cookies } from "@sveltejs/kit";
import type { RequestEvent } from "../../routes/(auth)/login/$types";
import { DbProvider } from "./db";
import sha256 from 'crypto-js/sha256';
const db = new DbProvider();

export async function login(username: string, password: string): Promise<User | null> {
    try {
        let user = await db.table<User>('Users')
            .where('username', username)
            .andWhere('password', sha256(password).toString())
            .select('userId', 'username', 'email')
            .first()
        user = Object.assign({}, user);
        if(!user?.userId) throw Error('User not found.');
        return user;
    } catch(error: any) {
        console.error(error.message || error);
        return null;
    }
}


export async function authenticate(cookies: Cookies): Promise<User | null> {
    const userId = cookies.get('session_token');
    try {
        if(!userId) return null;
        let user = await db.table<User>('Users')
            .where({ userId })
            .select('userId', 'username', 'email')
            .first()
        user = Object.assign({}, user);
        if(!user?.userId) throw Error('User not found.');
        return user;
    } catch(error: any) {
        console.error(error.message || error);
        return null;
    }

}