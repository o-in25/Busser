import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MailClient } from '$lib/server/mail';

const mailClient = new MailClient();

export const GET: RequestHandler = async () => {
  return json({});
};

export const POST: RequestHandler = async () => {

  await mailClient.sendUserRegistrationEmail(['ehalligan12@gmail.com'], {
    username: '',
    token: ''
  })
  return json({

  });
};