import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

type FallbackMode = 'block' | 'allow';

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

let client: Redis | null = null;

export function getRedis(): Redis {
	client ??= new Redis({
		url: env.UPSTASH_REDIS_REST_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN,
	});
	return client;
}

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
