import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes } from 'http-status-codes';
import type { RegistrationToken } from '$lib/types/auth';
import { verifyUser } from '$lib/server/user';

export const load = (async ({ params }) => {


    const token = params.token;
    if(!token) {
      return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
    }

    const queryResult = await verifyUser(token);
    return queryResult;
}) satisfies PageServerLoad;