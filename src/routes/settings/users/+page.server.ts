import { DbProvider } from '$lib/server/db';
import type { User } from '$lib/types';
import type { PageServerLoad } from './$types';
const db = new DbProvider();

export const load: PageServerLoad = async () => {
  let users = await db.table<User>('Users');
  users = users.map(user => Object.assign({}, user));
  console.log(users)
  return { users };
};