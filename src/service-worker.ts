/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE_NAME = `busser-${version}`;
const IMAGE_CACHE = 'busser-images';
const MAX_CACHED_IMAGES = 200;

// app shell assets to pre-cache on install
const PRECACHE_ASSETS = [
	...build,
	'/offline.html',
];

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_ASSETS))
			.then(() => sw.skipWaiting()),
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				// keep the image cache across deploys, only purge old app caches
				Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== IMAGE_CACHE).map((k) => caches.delete(k))),
			)
			.then(() => sw.clients.claim()),
	);
});

// trim image cache to stay under the size cap
async function trimImageCache() {
	const cache = await caches.open(IMAGE_CACHE);
	const keys = await cache.keys();
	if (keys.length > MAX_CACHED_IMAGES) {
		const toDelete = keys.slice(0, keys.length - MAX_CACHED_IMAGES);
		await Promise.all(toDelete.map((k) => cache.delete(k)));
	}
}

sw.addEventListener('fetch', (event) => {
	const { request } = event;

	// only handle GET requests
	if (request.method !== 'GET') return;

	const url = new URL(request.url);

	// gcs images — network-first, cache successful responses
	if (url.hostname === 'storage.googleapis.com') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (response.ok) {
						const clone = response.clone();
						caches.open(IMAGE_CACHE).then((cache) => {
							cache.put(request, clone);
							trimImageCache();
						});
					}
					return response;
				})
				.catch(() =>
					caches.match(request).then((cached) => cached || new Response('', { status: 504 })),
				),
		);
		return;
	}

	// skip other cross-origin requests
	if (url.origin !== location.origin) return;

	// navigation requests — network first, fall back to offline page
	if (request.mode === 'navigate') {
		event.respondWith(
			fetch(request)
				.then((response) => {
					// cache successful navigations for offline use
					const clone = response.clone();
					caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
					return response;
				})
				.catch(() => caches.match('/offline.html').then((r) => r || new Response('Offline', { status: 503 }))),
		);
		return;
	}

	// build assets are hashed and immutable — serve from cache first
	if (PRECACHE_ASSETS.includes(url.pathname)) {
		event.respondWith(
			caches.match(request).then(
				(cached) =>
					cached ||
					fetch(request).then((response) => {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
						return response;
					}),
			),
		);
	}
});
