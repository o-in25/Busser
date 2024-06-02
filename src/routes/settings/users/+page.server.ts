import { getUsers } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const users = await getUsers();
  return { args: users };
};