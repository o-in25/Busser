import { resetPassword } from "$lib/server/auth";
import type { Actions } from "@sveltejs/kit";

const actions = {
  default: async({ request, params }) => {
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


export { actions }