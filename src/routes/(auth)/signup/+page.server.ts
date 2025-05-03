import { fail, redirect } from '@sveltejs/kit';
import { StatusCodes } from 'http-status-codes';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals }) => {
  // if(locals.user?.userId) {
  //   return redirect(StatusCodes.TEMPORARY_REDIRECT, '/')
  // }
  return {};
}) satisfies PageServerLoad;

export const actions = {
  default: async ({ request }) => {
    let formData: any = await request.formData();
    formData = Object.fromEntries(formData);

    let errors = {
      username: {
        hasError: false,
        message: '',
      },
      email: {
        hasError: false,
        message: '',
      },
      password: {
        hasError: true,
        message: '',
      },
      passwordConfirm: {
        hasError: false,
        message: '',
      },
    };


    return {
      errors
    };


    return fail(StatusCodes.BAD_REQUEST, {
      error: {
        message: 'Username or password is incorrect.',
      },
      args: {}

    });
    // return fail(StatusCodes.BAD_REQUEST, {
    //   args: {
    //     errors: {
    //       username: {
    //         hasError: true,
    //         message: 'Username taken.'
    //       },
    //       email: {
    //         hasError: true,
    //         message: 'Invalid email.'
    //       },
    //       password: {
    //         hasError: true,
    //         message: 'Invalid password.'
    //       },
    //       passwordConfirm: {
    //         hasError: true,
    //         message: 'Invalid password confirm.'
    //       }
    //     }
    //   }
    // } as any);

    // redirect(StatusCodes.TEMPORARY_REDIRECT, '/check-email');
  }
};