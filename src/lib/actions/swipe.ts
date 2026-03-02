import { goto } from '$app/navigation';
import type { Action } from 'svelte/action';

interface SwipeNavParams {
	currentPath: string;
}

const TAB_ORDER = ['/', '/inventory', '/catalog', '/assistant', '/tools'];
const MIN_DISTANCE = 50;
const MAX_VERTICAL = 100;
const MIN_VELOCITY = 0.3; // px/ms

function getRouteKey(pathname: string): string {
	const match = pathname.match(/^\/[^/]*/);
	return match?.[0] || '/';
}

function isTopLevelTab(pathname: string): boolean {
	const key = getRouteKey(pathname);
	if (!TAB_ORDER.includes(key)) return false;
	// only activate on exact tab pages or one level deep (e.g. /catalog but not /catalog/browse/123)
	const segments = pathname.split('/').filter(Boolean);
	return segments.length <= 1;
}

export const swipe: Action<HTMLElement, SwipeNavParams> = (node, params) => {
	let currentPath = params?.currentPath ?? '/';
	let startX = 0;
	let startY = 0;
	let startTime = 0;

	function onTouchStart(e: TouchEvent) {
		startX = e.touches[0].clientX;
		startY = e.touches[0].clientY;
		startTime = Date.now();
	}

	function onTouchEnd(e: TouchEvent) {
		if (!isTopLevelTab(currentPath)) return;

		const endX = e.changedTouches[0].clientX;
		const endY = e.changedTouches[0].clientY;
		const dx = endX - startX;
		const dy = Math.abs(endY - startY);
		const elapsed = Date.now() - startTime;

		if (Math.abs(dx) < MIN_DISTANCE || dy > MAX_VERTICAL) return;
		if (elapsed === 0 || Math.abs(dx) / elapsed < MIN_VELOCITY) return;

		const key = getRouteKey(currentPath);
		const currentIndex = TAB_ORDER.indexOf(key);
		if (currentIndex === -1) return;

		const direction = dx < 0 ? 1 : -1; // swipe left = forward, swipe right = back
		const nextIndex = currentIndex + direction;
		if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) return;

		document.documentElement.setAttribute('data-nav-direction', direction > 0 ? 'forward' : 'back');
		goto(TAB_ORDER[nextIndex]);
	}

	node.addEventListener('touchstart', onTouchStart, { passive: true });
	node.addEventListener('touchend', onTouchEnd, { passive: true });

	return {
		update(newParams: SwipeNavParams) {
			currentPath = newParams?.currentPath ?? '/';
		},
		destroy() {
			node.removeEventListener('touchstart', onTouchStart);
			node.removeEventListener('touchend', onTouchEnd);
		},
	};
};
