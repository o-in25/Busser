import { DbProvider } from "./db";
import type { User } from '../types/user';
import sha256 from 'crypto-js/sha256';
import type { Session } from "$lib/types/session";
import { dev } from '$app/environment';

export class AuthService {
    static dbProvider: DbProvider = new DbProvider();

    constructor() {
    }


    async login(username: string, password: string): Promise<Session | null> {
        try {
            const session: Session = {
                opts: {
                    path: '/',
                    httpOnly: true,
                    sameSite: 'strict',
                    secure: !dev,
                    maxAge: 60 * 60 * 24 * 7 
                }
            };
            const { userId, password: hashedPassword } = await AuthService.dbProvider.table<User>('Users')
                .where({ username })
                    .first() || {};
                    
            if(!userId || !hashedPassword) return session;
            if(sha256(password).toString() !== hashedPassword) return session;
            return { ...session, userId };
        } catch(error: any) {
            console.error(error.message || error);
            return null;
        }
    }

    // async getUser(username: string): Promise<User | null> {
    //     try {
    //         const users = await AuthService.dbProvider.table<User>('Users').where({ username }).first();
    //     } catch({ message }: any) {
    //         console.error(message);
    //         return null;
    //     }
    // }

    async getAllUsers(): Promise<Array<User>> {
        try {
            const users = await AuthService.dbProvider.table<User>('Users') || [];
            return users.map(user => JSON.parse(JSON.stringify(user)))
        } catch({ message }: any) {
            console.error(message);
            return [];
        }
    }
}