import type { RequestEvent } from '@sveltejs/kit';

import { hasGlobalPermission } from '$lib/server/auth';
// checkRateLimit lives in redis.ts (the redis-backed metering primitive). keeping it in a
// separate module lets enforceRateLimit call it across a boundary tests can spy on.
import { checkRateLimit, type RateLimitConfig } from '$lib/server/redis';

// re-export so callers keep importing the rate-limit api from one place
export { checkRateLimit } from '$lib/server/redis';
export type { RateLimitConfig, RateLimitResult } from '$lib/server/redis';

const HOUR = 60 * 60 * 1000;

const rateLimitTiers: Record<string, RateLimitConfig> = {
	'image-gen': { maxRequests: 5, windowMs: HOUR },
	'ai-chat': { maxRequests: 15, windowMs: HOUR },
	'text-gen': { maxRequests: 30, windowMs: HOUR },
	upload: { maxRequests: 20, windowMs: HOUR },
	places: { maxRequests: 15, windowMs: HOUR },
};

// paid-resource routes we meter. method defaults to POST; set it for anything else.
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

// returns a 429 or null to let the request through
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
