import { redirect } from '@sveltejs/kit';
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
    console.log(formData)
    redirect(StatusCodes.TEMPORARY_REDIRECT, '/check-email')
  }
}