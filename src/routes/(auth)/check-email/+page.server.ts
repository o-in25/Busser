import { signToken } from '$lib/server/auth';
import { MailClient } from '$lib/server/mail';
import type { PageServerLoad } from './$types';

const mailClient = new MailClient();

export const load = (async ({ url }) => {
  // const token = await signToken({
  //   name: 'test'
  // })


  // await mailClient.sendUserRegistrationEmail(["eoinhalligan3@gmail.com"], {
  //   username: 'eoin',
  //   token
  // })


  const email = url.searchParams.get('email');
  const registrationToken = url.searchParams.get('registrationToken');

  return {
    email, registrationToken
  }

}) satisfies PageServerLoad;