import { getGrants, roleSelect } from '$lib/server/user';
import type { Permission, Role } from '$lib/types/auth';
import type { PageServerLoad } from './$types';

export const load = (async ({ url }) => {
  const role = url.searchParams.get('role') || ''
  const roles = await roleSelect();
  let grants: Array<Role & Permission> = [];
  if(role) {
    const queryResult = await getGrants(role);
    if('data' in queryResult) {
      grants = queryResult.data || []
    }
  }

  return {
    roles, grants   
  };
}) satisfies PageServerLoad;