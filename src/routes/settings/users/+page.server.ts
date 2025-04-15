import { getUsers } from "$lib/server/user";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from './$types';
import { getReasonPhrase, StatusCodes } from "http-status-codes";

export const load: PageServerLoad = async ({ locals }) => {
  if(!locals.user?.permissions.find(({ permissionName }) => permissionName === 'view_admin')) {
    error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to access this resource.'
    });
  }
  const users = await getUsers();
  return { args: users };
};