import { Ratelimit } from '@upstash/ratelimit';
import type { RequestEvent } from '@sveltejs/kit';

import { getRedis } from '$lib/server/redis';
import { hasGlobalPermission } from '$lib/server/auth';

type FallbackMode = 'block' | 'allow';

const limiters = new Map<string, Ratelimit>();
const HOUR = 60 * 60 * 1000;

function getLimiter(config: RateLimitConfig): Ratelimit {
	const cacheKey = `${config.maxRequests}:${config.windowMs}`;
	let limiter = limiters.get(cacheKey);
	if (!limiter) {
		limiter = new Ratelimit({
			redis: getRedis(),
			limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs} ms`),
			prefix: 'busser',
			ephemeralCache: new Map(),
		});
		limiters.set(cacheKey, limiter);
	}
	return limiter;
}

const rateLimitTiers: Record<string, RateLimitConfig> = {
	'image-gen': { maxRequests: 5, windowMs: HOUR },
	'ai-chat': { maxRequests: 15, windowMs: HOUR },
	'text-gen': { maxRequests: 30, windowMs: HOUR },
	upload: { maxRequests: 20, windowMs: HOUR },
	places: { maxRequests: 15, windowMs: HOUR },
};

const rateLimitRoutes: Array<{ path: string; tier: string; method?: string }> = [
	{ path: '/api/generator/image', tier: 'image-gen' },
	{ path: '/api/assistant/chat', tier: 'ai-chat' },
	{ path: '/api/inventory/scan', tier: 'ai-chat' },
	{ path: '/api/generator/recipe', tier: 'text-gen' },
	{ path: '/api/generator/catalog', tier: 'text-gen' },
	{ path: '/api/generator/inventory', tier: 'text-gen' },
	{ path: '/api/generator/category', tier: 'text-gen' },
	{ path: '/api/generator/rating', tier: 'text-gen' },
	{ path: '/api/generator/product-rating', tier: 'text-gen' },
	{ path: '/api/upload/image', tier: 'upload' },
	{ path: '/api/suppliers/nearby', tier: 'places', method: 'GET' },
];

export function getClientIp(request: Request): string {
	const forwardedFor = request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		// may contain multiple ips but first is the client
		return forwardedFor.split(',')[0].trim();
	}

	const realIp = request.headers.get('x-real-ip');
	if (realIp) {
		return realIp;
	}

	// fly stuff
	const flyClientIp = request.headers.get('fly-client-ip');
	if (flyClientIp) {
		return flyClientIp;
	}

	return 'unknown';
}

export async function checkRateLimit(
	key: string,
	config: RateLimitConfig,
	onError: FallbackMode = 'block'
): Promise<RateLimitResult> {
	try {
		const { success, remaining, reset } = await getLimiter(config).limit(key);
		return {
			allowed: success,
			remaining,
			resetAt: reset,
			retryAfterMs: success ? undefined : reset - Date.now(),
		};
	} catch {
		// cant reach redis so cant verify the count
		const allowed = onError === 'allow';
		return {
			allowed,
			remaining: 0,
			resetAt: Date.now() + config.windowMs,
			retryAfterMs: allowed ? undefined : config.windowMs,
		};
	}
}

// returns a 429 to or null to let the request through
export async function enforceRateLimit(event: RequestEvent): Promise<Response | null> {
	const { user } = event.locals;
	if (!user) return null;

	const match = rateLimitRoutes.find(
		(r) => event.url.pathname === r.path && (r.method ?? 'POST') === event.request.method
	);
	if (!match || hasGlobalPermission(user, 'edit_admin')) return null;

	const key = `rate:${user.userId}:${match.tier}`;
	const result = await checkRateLimit(key, rateLimitTiers[match.tier]);
	if (result.allowed) return null;

	return new Response(
		JSON.stringify({ error: 'Rate limit exceeded', retryAfterMs: result.retryAfterMs }),
		{ status: 429, headers: { 'Content-Type': 'application/json' } }
	);
}

export type RateLimitConfig = {
	maxRequests: number;
	windowMs: number;
};

export type RateLimitResult = {
	allowed: boolean;
	remaining: number;
	resetAt: number;
	retryAfterMs?: number;
};
