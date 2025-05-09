import { goto } from '$app/navigation';
import { signToken, verifyToken } from '$lib/server/auth';
import { MailClient } from '$lib/server/mail';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodes } from 'http-status-codes';
import type { RegistrationToken } from '$lib/types/auth';
import { verifyUser } from '$lib/server/user';

const mailClient = new MailClient();

export const load = (async ({ url }) => {
  // const token = await signToken({
  //   name: 'test'
  // })


  // await mailClient.sendUserRegistrationEmail(["eoinhalligan3@gmail.com"], {
  //   username: 'eoin',
  //   token
  // })


  // const registrationToken = url.searchParams.get('registrationToken');
  const registrationToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjYmZlZDU3MS0yYzgxLTExZjAtOWY0ZC00MjAxMGE0MDAwMDMiLCJpYXQiOjE3NDY3NTk2NDMsImV4cCI6MTc0Njg0NjA0M30.UvgCzL05PEQz_9mT3naLqJS4-YOcuL06ZkeQRKmlrp0";
  let queryResult = await verifyUser(registrationToken);

  

  // if(!email && !registrationToken) {
  //   return redirect(StatusCodes.TEMPORARY_REDIRECT, '/');
  // }

  return {
    registrationToken
    // email, registrationToken
  }

}) satisfies PageServerLoad;