import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { resendVerificationEmail, resendVerificationEmailByEmail } from '$lib/server/user';

export const GET: RequestHandler = async () => {
  return json({});
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userId, email } = await request.json();

    if(!userId && !email) {
      return json({ error: 'User ID or email is required.' }, { status: 400 });
    }

    // Prefer userId if provided, otherwise use email
    const result = userId
      ? await resendVerificationEmail(userId)
      : await resendVerificationEmailByEmail(email);

    if(result.status === 'error') {
      return json({ error: result.error || 'Failed to resend verification email.' }, { status: 400 });
    }

    return json({ success: true });
  } catch(err: any) {
    return json({ error: err.message || 'An error occurred.' }, { status: 500 });
  }
};