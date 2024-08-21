import { getUsers } from "$lib/server/auth";
export async function load() {
    let users = await getUsers();
    users = JSON.parse(JSON.stringify(users));
    return { users };
}