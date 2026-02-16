import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/auth', () => ({
	authenticate: vi.fn(),
	hasGlobalPermission: vi.fn(),
	getUserWorkspaces: vi.fn(),
	hasWorkspaceAccess: vi.fn(),
}));

vi.mock('$lib/server/user', () => ({
	getPreferredWorkspaceId: vi.fn(),
}));

vi.mock('$lib/server/rate-limit', async () => {
	const actual = await vi.importActual<typeof import('$lib/server/rate-limit')>('$lib/server/rate-limit');
	return { ...actual, checkRateLimit: vi.fn(actual.checkRateLimit) };
});

import { authenticate, hasGlobalPermission, hasWorkspaceAccess, getUserWorkspaces } from '$lib/server/auth';
import { getPreferredWorkspaceId } from '$lib/server/user';
import { checkRateLimit } from '$lib/server/rate-limit';
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
	vi.mocked(checkRateLimit).mockClear();
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
		vi.mocked(checkRateLimit).mockReturnValue({
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
});
