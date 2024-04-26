import type { User } from "$lib/types";
import type { Cookies } from "@sveltejs/kit";
import type { RequestEvent } from "../../routes/(auth)/login/$types";
import { DbProvider } from "./db";
import sha256 from 'crypto-js/sha256';
const db = new DbProvider();

export async function login(username: string, password: string): Promise<User | null>  {
    try {
        const user: User = await db.query.select('userId', 'username', 'email')
            .from<User>('Users')
                .where({ 
                    username, password: sha256(password).toString() })
                    .first();
        if(!user?.userId) throw Error('User not found.')
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
        const user: User = await db.query.select('userId', 'username', 'email')
            .from<User>('Users')
                .where({ userId })
                    .first();
        return user || null;
    } catch (error: any) {
        console.error(error.message || error);
        return null;
    }

}