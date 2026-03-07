import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({ dev: true }));

vi.mock('$lib/server/auth', () => ({
	authRepo: {
		signToken: vi.fn().mockResolvedValue('jwt-token'),
	},
	oauthRepo: {
		findByOAuthAccount: vi.fn(),
		linkOAuthAccount: vi.fn(),
		registerOAuth: vi.fn(),
	},
	userRepo: {
		findByEmail: vi.fn(),
	},
}));

import {
	generateOAuthState,
	parseOAuthState,
	getAuthorizationUrl,
} from '$lib/server/oauth';

// --- generateOAuthState ---

describe('generateOAuthState', () => {
	it('generates state with CSRF token and no invite', () => {
		const state = generateOAuthState();
		const parsed = JSON.parse(atob(state));

		expect(parsed.token).toBeTruthy();
		expect(parsed.inviteCode).toBeNull();
	});

	it('includes invite code when provided', () => {
		const state = generateOAuthState('INVITE-123');
		const parsed = JSON.parse(atob(state));

		expect(parsed.token).toBeTruthy();
		expect(parsed.inviteCode).toBe('INVITE-123');
	});

	it('generates unique tokens each time', () => {
		const state1 = generateOAuthState();
		const state2 = generateOAuthState();

		const parsed1 = JSON.parse(atob(state1));
		const parsed2 = JSON.parse(atob(state2));

		expect(parsed1.token).not.toBe(parsed2.token);
	});
});

// --- parseOAuthState ---

describe('parseOAuthState', () => {
	it('parses valid state string', () => {
		const original = { token: 'csrf-123', inviteCode: 'INV-1' };
		const encoded = btoa(JSON.stringify(original));

		const result = parseOAuthState(encoded);

		expect(result.token).toBe('csrf-123');
		expect(result.inviteCode).toBe('INV-1');
	});

	it('returns null inviteCode when not present', () => {
		const original = { token: 'csrf-123' };
		const encoded = btoa(JSON.stringify(original));

		const result = parseOAuthState(encoded);

		expect(result.token).toBe('csrf-123');
		expect(result.inviteCode).toBeNull();
	});

	it('throws on invalid base64', () => {
		expect(() => parseOAuthState('not-valid-base64!!!')).toThrow('Invalid OAuth state.');
	});

	it('throws when token is missing', () => {
		const encoded = btoa(JSON.stringify({ inviteCode: 'INV-1' }));
		expect(() => parseOAuthState(encoded)).toThrow();
	});

	it('throws on non-JSON content', () => {
		const encoded = btoa('just a plain string');
		expect(() => parseOAuthState(encoded)).toThrow('Invalid OAuth state.');
	});
});

// --- getAuthorizationUrl ---

describe('getAuthorizationUrl', () => {
	it('builds google authorization url with required params', () => {
		const url = getAuthorizationUrl('google', 'state-123');

		expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
		expect(url).toContain('response_type=code');
		expect(url).toContain('state=state-123');
		expect(url).toContain('scope=openid+email+profile');
		expect(url).toContain('access_type=offline');
		expect(url).toContain('prompt=consent');
	});

	it('includes redirect_uri', () => {
		const url = getAuthorizationUrl('google', 'state-123');
		expect(url).toContain('redirect_uri=');
		expect(url).toContain('callback%2Fgoogle');
	});
});

// --- handleCallback ---

describe('handleCallback', () => {
	let authRepo: any;
	let oauthRepo: any;
	let userRepo: any;

	beforeEach(async () => {
		const authModule = await import('$lib/server/auth');
		authRepo = authModule.authRepo;
		oauthRepo = authModule.oauthRepo;
		userRepo = authModule.userRepo;
		vi.clearAllMocks();
	});

	function makeCookies(storedToken: string | null = 'csrf-token') {
		return {
			get: vi.fn((name: string) => (name === 'oauth_state' ? storedToken : null)),
			set: vi.fn(),
			delete: vi.fn(),
		};
	}

	// handleCallback requires actual network calls (exchangeCode, getProfile)
	// so we test the state/CSRF validation parts that don't need network

	it('throws when oauth_state cookie is missing', async () => {
		const { handleCallback } = await import('$lib/server/oauth');
		const cookies = makeCookies(null);

		await expect(
			handleCallback('google', 'auth-code', 'state-param', cookies)
		).rejects.toThrow('Missing OAuth state cookie.');
	});

	it('throws when CSRF token does not match', async () => {
		const { handleCallback } = await import('$lib/server/oauth');
		const state = generateOAuthState();
		const cookies = makeCookies('different-csrf-token');

		await expect(
			handleCallback('google', 'auth-code', state, cookies)
		).rejects.toThrow('Invalid OAuth state.');
	});
});
