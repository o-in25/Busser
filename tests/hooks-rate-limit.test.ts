import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/auth', () => ({
	authenticate: vi.fn(),
	hasGlobalPermission: vi.fn(),
}));

vi.mock('$lib/server/workspace', () => ({
	getUserWorkspaces: vi.fn(),
	hasWorkspaceAccess: vi.fn(),
}));

vi.mock('$lib/server/user', () => ({
	getPreferredWorkspaceId: vi.fn(),
}));

// checkRateLimit lives in redis.ts; enforceRateLimit (rate-limit.ts) calls it across the
// boundary, so spying here intercepts the call
vi.mock('$lib/server/redis', async () => {
	const actual = await vi.importActual<typeof import('$lib/server/redis')>('$lib/server/redis');
	return { ...actual, checkRateLimit: vi.fn(actual.checkRateLimit) };
});

import { authenticate, hasGlobalPermission } from '$lib/server/auth';
import { hasWorkspaceAccess, getUserWorkspaces } from '$lib/server/workspace';
import { getPreferredWorkspaceId } from '$lib/server/user';
import { checkRateLimit } from '$lib/server/redis';
import { handle } from '../src/hooks.server';

const regularUser = {
	userId: 'user-1',
	username: 'testuser',
	permissions: [],
};

const adminUser = {
	userId: 'admin-1',
	username: 'admin',
	permissions: [{ permissionName: 'edit_admin' }],
};

function makeEvent(pathname: string, method = 'POST') {
	return {
		cookies: {
			get: vi.fn((name: string) => (name === 'activeWorkspaceId' ? 'ws-1' : undefined)),
			set: vi.fn(),
			delete: vi.fn(),
			serialize: vi.fn(),
			getAll: vi.fn(),
		},
		url: new URL(`http://localhost${pathname}`),
		request: new Request(`http://localhost${pathname}`, { method }),
		locals: {} as any,
		isDataRequest: false,
		isSubRequest: false,
		params: {},
		platform: undefined,
		route: { id: pathname },
	};
}

function mockResolve() {
	return vi.fn(async () => new Response('ok', { status: 200 }));
}

beforeEach(() => {
	vi.mocked(authenticate).mockResolvedValue(regularUser as any);
	vi.mocked(hasGlobalPermission).mockReturnValue(false);
	vi.mocked(hasWorkspaceAccess).mockResolvedValue('editor');
	vi.mocked(getUserWorkspaces).mockResolvedValue({ status: 'success', data: [] });
	vi.mocked(getPreferredWorkspaceId).mockResolvedValue(null);
	// default to allowed so tests don't hit real upstash — the 429 case overrides this
	vi.mocked(checkRateLimit).mockReset();
	vi.mocked(checkRateLimit).mockResolvedValue({
		allowed: true,
		remaining: 4,
		resetAt: Date.now() + 3600000,
	});
});

describe('hooks rate limiting', () => {
	it('allows request when under limit', async () => {
		const event = makeEvent('/api/generator/image');
		const resolve = mockResolve();

		const response = await handle({ event: event as any, resolve });
		expect(response.status).toBe(200);
		expect(checkRateLimit).toHaveBeenCalledWith('rate:user-1:image-gen', {
			maxRequests: 5,
			windowMs: 3600000,
		});
	});

	it('returns 429 when rate limit exceeded', async () => {
		vi.mocked(checkRateLimit).mockResolvedValue({
			allowed: false,
			remaining: 0,
			resetAt: Date.now() + 30000,
			retryAfterMs: 30000,
		});

		const event = makeEvent('/api/generator/image');
		const resolve = mockResolve();

		const response = await handle({ event: event as any, resolve });
		expect(response.status).toBe(429);

		const body = await response.json();
		expect(body.error).toBe('Rate limit exceeded');
		expect(body.retryAfterMs).toBe(30000);
		expect(resolve).not.toHaveBeenCalled();
	});

	it('admin users bypass rate limiting', async () => {
		vi.mocked(authenticate).mockResolvedValue(adminUser as any);
		vi.mocked(hasGlobalPermission).mockReturnValue(true);

		const event = makeEvent('/api/generator/image');
		const resolve = mockResolve();

		const response = await handle({ event: event as any, resolve });
		expect(response.status).toBe(200);
		expect(checkRateLimit).not.toHaveBeenCalled();
	});

	it('does not rate limit non-matched routes', async () => {
		const event = makeEvent('/api/some/other/endpoint');
		const resolve = mockResolve();

		const response = await handle({ event: event as any, resolve });
		expect(response.status).toBe(200);
		expect(checkRateLimit).not.toHaveBeenCalled();
	});

	it('does not rate limit GET requests to matched routes', async () => {
		const event = makeEvent('/api/generator/image', 'GET');
		const resolve = mockResolve();

		const response = await handle({ event: event as any, resolve });
		expect(response.status).toBe(200);
		expect(checkRateLimit).not.toHaveBeenCalled();
	});

	it('uses correct tier key for text-gen endpoints', async () => {
		const routes = [
			'/api/generator/recipe',
			'/api/generator/catalog',
			'/api/generator/inventory',
			'/api/generator/category',
			'/api/generator/rating',
			'/api/generator/product-rating',
		];

		for (const route of routes) {
			vi.mocked(checkRateLimit).mockClear();
			const event = makeEvent(route);
			const resolve = mockResolve();
			await handle({ event: event as any, resolve });

			expect(checkRateLimit).toHaveBeenCalledWith('rate:user-1:text-gen', {
				maxRequests: 30,
				windowMs: 3600000,
			});
		}
	});

	it('uses correct tier key for ai-chat endpoints', async () => {
		for (const route of ['/api/assistant/chat', '/api/inventory/scan']) {
			vi.mocked(checkRateLimit).mockClear();
			const event = makeEvent(route);
			const resolve = mockResolve();
			await handle({ event: event as any, resolve });

			expect(checkRateLimit).toHaveBeenCalledWith('rate:user-1:ai-chat', {
				maxRequests: 15,
				windowMs: 3600000,
			});
		}
	});

	it('uses correct tier key for upload endpoint', async () => {
		const event = makeEvent('/api/upload/image');
		const resolve = mockResolve();
		await handle({ event: event as any, resolve });

		expect(checkRateLimit).toHaveBeenCalledWith('rate:user-1:upload', {
			maxRequests: 20,
			windowMs: 3600000,
		});
	});

	it('rate limits the places GET endpoint', async () => {
		const event = makeEvent('/api/suppliers/nearby', 'GET');
		const resolve = mockResolve();
		await handle({ event: event as any, resolve });

		expect(checkRateLimit).toHaveBeenCalledWith('rate:user-1:places', {
			maxRequests: 15,
			windowMs: 3600000,
		});
	});

	it('does not rate limit the places route on the wrong method', async () => {
		const event = makeEvent('/api/suppliers/nearby', 'POST');
		const resolve = mockResolve();
		await handle({ event: event as any, resolve });

		expect(checkRateLimit).not.toHaveBeenCalled();
	});
});
