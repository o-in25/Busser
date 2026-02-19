import { Google, decodeIdToken } from 'arctic';

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APP_URL } = process.env;

const callbackUrl = `${APP_URL || 'http://localhost:5173'}/auth/google/callback`;

export const google = new Google(
	GOOGLE_CLIENT_ID || '',
	GOOGLE_CLIENT_SECRET || '',
	callbackUrl
);

export interface GoogleProfile {
	providerUserId: string;
	email: string;
	name: string;
}

export function getProfile(idToken: string): GoogleProfile {
	const claims = decodeIdToken(idToken) as {
		sub: string;
		email: string;
		name?: string;
		given_name?: string;
	};

	if (!claims?.sub || !claims?.email) {
		throw new Error('Invalid Google ID token');
	}

	return {
		providerUserId: claims.sub,
		email: claims.email,
		name: claims.name || claims.given_name || claims.email.split('@')[0],
	};
}
