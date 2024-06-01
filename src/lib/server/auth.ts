import type { Result, User } from "$lib/types";
import type { Cookies } from "@sveltejs/kit";
import type { RequestEvent } from "../../routes/(auth)/login/$types";
import { DbProvider } from "./db";
import sha256 from "crypto-js/sha256";
const db = new DbProvider();

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
                .table<User>("Users")
                .where("username", username)
                .andWhere("password", hashPassword(password))
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

export async function authenticate(cookies: Cookies): Promise<User | null> {
    const userId = cookies.get("session_token");
    try {
        if(!userId) return null;
        const user = Object.assign(
            {},
            await db
                .table<User>("Users")
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

export async function addUser(user: User, password: string) {
    try {
        const result = await db.table('Users').insert({
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
        const result = await db.table('Users').where({ userId }).update(user)
        return result;
    } catch(error) {
        console.error(error);
        return null;
    }
}