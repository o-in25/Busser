import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

// lazy singleton — dont construct at module top level, the analyse build step
// imports server modules with no secrets set
let client: Redis | null = null;

export function getRedis(): Redis {
	client ??= new Redis({
		url: env.UPSTASH_REDIS_REST_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN,
	});
	return client;
}
