import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes } from 'http-status-codes';
import { verifyUser } from '$lib/server/user';

export const load = (async ({ url }) => {

  const email = url.searchParams.get('email');
  // const registrationToken = url.searchParams.get('registrationToken');
  const registrationToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYmZlZDU3MS0yYzgxLTExZjAtOWY0ZC00MjAxMGE0MDAwMDMiLCJpYXQiOjE3NDY3NTk2NDMsImV4cCI6MTc0Njg0NjA0M30.UvgCzL05PEQz_9mT3naLqJS4-YOcuL06ZkeQRKmlrp0";
  

  if(!email && !registrationToken) {
    return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
  }
  
  if(registrationToken) {
    let queryResult = await verifyUser(registrationToken);

    if(queryResult.status === 'error') {

    }
  }
  
}) satisfies PageServerLoad;