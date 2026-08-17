import { Ratelimit } from '@upstash/ratelimit';

import { getRedis } from '$lib/server/redis';

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

// what to do when redis is unreachable and we cant verify the count.
// 'block' for paid resources (ai, storage, email) — rather reject than risk unmetered spend.
// 'allow' for core resources (auth) — dont break the app over our own outage.
type FallbackMode = 'block' | 'allow';

// cache limiters by window+limit so the ephemeral cache is shared across requests
const limiters = new Map<string, Ratelimit>();

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
		// cant reach redis so cant verify the count — decide statically by resource cost
		const allowed = onError === 'allow';
		return {
			allowed,
			remaining: 0,
			resetAt: Date.now() + config.windowMs,
			retryAfterMs: allowed ? undefined : config.windowMs,
		};
	}
}

export function getClientIp(request: Request): string {
	const forwardedFor = request.headers.get('x-forwarded-for');
	if (forwardedFor) {
		// may contain multiple ips, first is the client
		return forwardedFor.split(',')[0].trim();
	}

	const realIp = request.headers.get('x-real-ip');
	if (realIp) {
		return realIp;
	}

	const flyClientIp = request.headers.get('fly-client-ip');
	if (flyClientIp) {
		return flyClientIp;
	}

	return 'unknown';
}
