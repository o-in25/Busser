import type { PageServerLoad } from "./$types";
import { DbProvider } from "$lib/server/db";
import type { User } from "$lib/types";
const db = new DbProvider();

export const load: PageServerLoad = async () => {
    let users = await db.table<User>('Users');
    users = users.map(user => Object.assign({}, user));
    return { users }
};