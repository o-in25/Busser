/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE_NAME = `busser-${version}`;

// app shell assets to pre-cache on install
const PRECACHE_ASSETS = [...build, '/offline.html', '/icons/icon-192x192.png'];

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
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim()),
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;

	// only handle GET requests
	if (request.method !== 'GET') return;

	const url = new URL(request.url);

	// skip cross-origin requests
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

	// api requests — network only, no caching
	if (url.pathname.startsWith('/api/')) return;

	// static assets — cache first, fall back to network
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
});
