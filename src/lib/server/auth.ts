import { DbProvider } from "./db";
import type { User } from './types/user';

export class AuthService {
    dbProvider: DbProvider;

    constructor() {
       this.dbProvider = new DbProvider();
    }

    async login(username: string, password: string) {
        const rows = await this.dbProvider.table<User>('Users').where({ username, password }).first();
        return rows;

    }
}