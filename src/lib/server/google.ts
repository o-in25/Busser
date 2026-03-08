// shared google service account credentials and auth

const { GOOGLE_SERVICE_KEY } = process.env;

const base64Decode = (str: string) => (str ? Buffer.from(str, 'base64').toString() : '{}');

let cachedCredentials: any = null;

export function getCredentials(): any {
	if (!cachedCredentials) {
		cachedCredentials = JSON.parse(base64Decode(GOOGLE_SERVICE_KEY || ''));
	}
	return cachedCredentials;
}

// cached access token with expiry
let cachedToken: { token: string; expiresAt: number } | null = null;

export async function getAccessToken(
	scope: string = 'https://www.googleapis.com/auth/cloud-platform'
): Promise<string> {
	if (cachedToken && Date.now() < cachedToken.expiresAt) {
		return cachedToken.token;
	}

	const credentials = getCredentials();
	const now = Math.floor(Date.now() / 1000);
	const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
	const payload = btoa(
		JSON.stringify({
			iss: credentials.client_email,
			scope,
			aud: 'https://oauth2.googleapis.com/token',
			iat: now,
			exp: now + 3600,
		})
	);

	const { createSign } = await import('crypto');
	const signer = createSign('RSA-SHA256');
	signer.update(`${header}.${payload}`);
	const signature = signer
		.sign(credentials.private_key, 'base64')
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');

	const jwt = `${header}.${payload}.${signature}`;

	const res = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
	});

	if (!res.ok) {
		throw new Error(`Failed to get access token: ${res.statusText}`);
	}

	const data = await res.json();

	// cache with 5 minute buffer before expiry
	cachedToken = {
		token: data.access_token,
		expiresAt: Date.now() + (data.expires_in - 300) * 1000,
	};

	return data.access_token;
}
