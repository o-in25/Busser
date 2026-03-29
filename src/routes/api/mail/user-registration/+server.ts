import { json } from '@sveltejs/kit';

import { checkRateLimit, getClientIp } from '$lib/server/rate-limit';
import { resendVerificationEmail, resendVerificationEmailByEmail } from '$lib/server/user';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	return json({});
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const ip = getClientIp(request);
		const rateLimit = checkRateLimit(`mail-resend:${ip}`, { maxRequests: 3, windowMs: 60 * 1000 });
		if (!rateLimit.allowed) {
			return json({ success: true });
		}

		const { userId, email } = await request.json();

		if (!userId && !email) {
			return json({ error: 'User ID or email is required.' }, { status: 400 });
		}

		// prefer userId if provided, otherwise use email
		const result = userId
			? await resendVerificationEmail(userId)
			: await resendVerificationEmailByEmail(email);

		// always return success to prevent email enumeration
		if (result.status === 'error') {
			return json({ success: true });
		}

		return json({ success: true });
	} catch (err: any) {
		return json({ success: true });
	}
};
