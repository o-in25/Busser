import { signToken } from '$lib/server/auth';
import { sendRegisterUserEmail } from '$lib/server/mail';
import type { PageServerLoad } from './$types';

export const load = (async () => {
  const token = await signToken({
    name: 'test'
  })
  await sendRegisterUserEmail(["eoinhalligan3@gmail.com"], "eoin", token)


}) satisfies PageServerLoad;