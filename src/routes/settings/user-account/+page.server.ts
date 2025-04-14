import { getUser } from '$lib/server/user';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes } from 'http-status-codes';

export const load = (async ({ locals }) => {
  const userId = locals.user?.userId || '';
  const queryResult = await getUser(userId);
  if(queryResult.status === 'error') {
    return error(StatusCodes.NOT_FOUND)
  }

  const user = queryResult.data;
  return user;
}) satisfies PageServerLoad;