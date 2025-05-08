import { signToken } from '$lib/server/auth';
import { MailClient } from '$lib/server/mail';
import type { PageServerLoad } from './$types';

const mailClient = new MailClient();

export const load = (async () => {
  const token = await signToken({
    name: 'test'
  })


  await mailClient.sendUserRegistrationEmail(["eoinhalligan3@gmail.com"], {
    username: 'eoin',
    token
  })


}) satisfies PageServerLoad;