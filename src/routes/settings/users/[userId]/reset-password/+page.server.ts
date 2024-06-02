import type { Actions } from "@sveltejs/kit";

const actions = {
  default: async({ request }) => {
    const formData = await request.formData();
    const oldPassword = formData.get('oldPassword');
    const newPassword = formData.get('newPassword');
    const passwordConfirm = formData.get('passwordConfirm');
    console.log({ oldPassword, newPassword, passwordConfirm })
    return { args: {} };
  }
} satisfies Actions;


export { actions }