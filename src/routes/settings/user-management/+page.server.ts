import { getUsers } from "$lib/server/user";
export async function load() {
  let users = await getUsers();
  users = JSON.parse(JSON.stringify(users));
  return { users };
}