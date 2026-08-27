import { Redis } from '@upstash/redis';
import { env } from '$env/dynamic/private';

let client: Redis | null = null;

export function getRedis(): Redis {
	client ??= new Redis({
		url: env.UPSTASH_REDIS_REST_URL,
		token: env.UPSTASH_REDIS_REST_TOKEN,
	});
	return client;
}
