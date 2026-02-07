import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { checkRateLimit, getClientIp } from '$lib/server/rate-limit';

// ---- checkRateLimit ----

describe('checkRateLimit', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const config = { maxRequests: 3, windowMs: 60_000 };

	it('first request is allowed with remaining = maxRequests - 1', () => {
		const result = checkRateLimit('test-key-1', config);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(2);
	});

	it('subsequent requests decrement remaining count', () => {
		const key = 'test-key-2';
		checkRateLimit(key, config);
		const second = checkRateLimit(key, config);
		expect(second.allowed).toBe(true);
		expect(second.remaining).toBe(1);

		const third = checkRateLimit(key, config);
		expect(third.allowed).toBe(true);
		expect(third.remaining).toBe(0);
	});

	it('request at limit is blocked', () => {
		const key = 'test-key-3';
		checkRateLimit(key, config);
		checkRateLimit(key, config);
		checkRateLimit(key, config);

		const blocked = checkRateLimit(key, config);
		expect(blocked.allowed).toBe(false);
		expect(blocked.remaining).toBe(0);
	});

	it('returns retryAfterMs when blocked', () => {
		const key = 'test-key-4';
		checkRateLimit(key, config);
		checkRateLimit(key, config);
		checkRateLimit(key, config);

		const blocked = checkRateLimit(key, config);
		expect(blocked.retryAfterMs).toBeDefined();
		expect(blocked.retryAfterMs).toBeGreaterThan(0);
		expect(blocked.retryAfterMs).toBeLessThanOrEqual(config.windowMs);
	});

	it('allows requests again after window expires', () => {
		const key = 'test-key-5';
		checkRateLimit(key, config);
		checkRateLimit(key, config);
		checkRateLimit(key, config);

		// blocked
		expect(checkRateLimit(key, config).allowed).toBe(false);

		// advance past the window
		vi.advanceTimersByTime(config.windowMs + 1);

		// should be allowed again
		const result = checkRateLimit(key, config);
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(2);
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
