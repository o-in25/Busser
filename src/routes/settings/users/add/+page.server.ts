import { addUser, roleSelect } from "$lib/server/user";
import type { User } from '$lib/types/auth';

export const load = (async () => {
    const roles = await roleSelect();
    return { roles };
})

const actions = {
  default: async ({ request, params }) => {
    const formData = await request.formData();
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');    
    const passwordConfirm = formData.get('passwordConfirm');    
    const roles = formData.get('roles');
    console.log(roles)
    if(false) {
      return {
        error: { message: 'The two passwords do not match.' }
      }
    }

    let user = await addUser(username, email, password, roles.split(','));
    if(!user) {
      return {
        error: { message: 'Could not create user.' }
      }
    }

    return {
      success: { message: 'User has been created.' }
    }
  },
};


export { actions }

