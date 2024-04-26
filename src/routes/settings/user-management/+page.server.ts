import type { PageServerLoad } from "./$types";
import type { User } from "$lib/types";
import { DbProvider } from "$lib/server/db";
const db = new DbProvider();

export const load: PageServerLoad = async () => {
    let users = await db.table<User>('Users');
    users = users.map(user => Object.assign({}, user));
    return { users }
};