import { resetPassword } from "$lib/server/auth";
import { error, type Actions } from "@sveltejs/kit";
import { getReasonPhrase, StatusCodes } from "http-status-codes";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals }) => {
  if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_admin')) {
    return error(StatusCodes.UNAUTHORIZED, {
      reason: getReasonPhrase(StatusCodes.UNAUTHORIZED),
      code: StatusCodes.UNAUTHORIZED,
      message: 'You do not have permission to access this resource.'
    });
  }
}

export const actions = {
  default: async({ request, params, locals}) => {
    let { userId } = params;
    userId = userId || '';
    let formData: any = await request.formData();

    formData = Array.from(formData.entries())
      .reduce((acc: any, [key, value]: any) => {
        acc[key] = value;
        return acc; 
      }, {});

    const { 
      oldPassword, 
      newPassword, 
      passwordConfirm
    } = formData;

    if(!locals.user?.permissions.map(({ permissionName }) => permissionName).includes('edit_admin')) {
      return {
        error: { message: "You do not have permission to perform this action"}
      }
    }

    if(newPassword !== passwordConfirm) {
      return {
        error: { message: "Password and password confirmation don't match."}
      }
    }

    const changed = await resetPassword(userId, oldPassword, newPassword);
    if(!changed) {
      return {
        error: { message: "Old password isn't correct." }
      }
    }

    return {
      success: { message: "Password has been updated." }
    }
  }
} satisfies Actions;

