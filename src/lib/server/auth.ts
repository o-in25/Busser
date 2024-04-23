import { DbProvider } from "./db";
import type { User } from './types/user';
import sha256 from 'crypto-js/sha256';

export class AuthService {
    dbProvider: DbProvider;

    constructor() {
       this.dbProvider = new DbProvider();
    }

    async login(username: string, password: string): Promise<User|null> {
        try {
            const user = await this.dbProvider.table<User>('Users').where({ username }).first();
            if(!user?.userId) throw new Error('User not found.');
            return user;
        } catch({ message }: any) {
            console.error(message);
            return null;
        }
    }
}