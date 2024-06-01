import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { User } from '$lib/types';
import { P } from 'flowbite-svelte';
import { addUser } from '$lib/server/auth';

// const load = (async () => {
//     return {};
// })

const actions = {
  default: async ({ request, params }) => {
    const formData = await request.formData();
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');    
    const passwordConfirm = formData.get('passwordConfirm');    

    if(password !== passwordConfirm) {
      return {
        error: { message: 'The two passwords do not match.' }
      }
    }

    let user = await addUser({ username, email } as User, password);
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