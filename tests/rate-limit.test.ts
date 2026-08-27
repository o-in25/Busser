import { describe, it, expect, vi } from 'vitest';

import { checkRateLimit, getClientIp } from '$lib/server/rate-limit';

// force the redis path to fail so we exercise the fallback decision — make the limiter throw
vi.mock('@upstash/redis', () => ({ Redis: class {} }));
vi.mock('@upstash/ratelimit', () => ({
	Ratelimit: class {
		static slidingWindow() {
			return {};
		}
		limit() {
			throw new Error('no redis in tests');
		}
	},
}));

// ---- checkRateLimit (redis-down fallback) ----

describe('checkRateLimit fallback', () => {
	const config = { maxRequests: 3, windowMs: 60_000 };

	it('blocks by default when redis is down (paid resources)', async () => {
		const result = await checkRateLimit('paid-key', config);
		expect(result.allowed).toBe(false);
		expect(result.retryAfterMs).toBe(config.windowMs);
	});

	it("blocks when onError is 'block'", async () => {
		const result = await checkRateLimit('paid-key', config, 'block');
		expect(result.allowed).toBe(false);
	});

	it("allows when onError is 'allow' (core resources)", async () => {
		const result = await checkRateLimit('core-key', config, 'allow');
		expect(result.allowed).toBe(true);
		expect(result.retryAfterMs).toBeUndefined();
	});
});

// ---- getClientIp ----

describe('getClientIp', () => {
	it('extracts first IP from x-forwarded-for', () => {
		const request = new Request('http://localhost', {
			headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' },
		});
		expect(getClientIp(request)).toBe('1.2.3.4');
	});

	it('uses x-real-ip when no x-forwarded-for', () => {
		const request = new Request('http://localhost', {
			headers: { 'x-real-ip': '10.0.0.1' },
		});
		expect(getClientIp(request)).toBe('10.0.0.1');
	});

	it('uses fly-client-ip when no other headers', () => {
		const request = new Request('http://localhost', {
			headers: { 'fly-client-ip': '172.16.0.1' },
		});
		expect(getClientIp(request)).toBe('172.16.0.1');
	});

	it('returns unknown when no IP headers present', () => {
		const request = new Request('http://localhost');
		expect(getClientIp(request)).toBe('unknown');
	});

	it('prefers x-forwarded-for over x-real-ip', () => {
		const request = new Request('http://localhost', {
			headers: {
				'x-forwarded-for': '1.1.1.1',
				'x-real-ip': '2.2.2.2',
			},
		});
		expect(getClientIp(request)).toBe('1.1.1.1');
	});
});
