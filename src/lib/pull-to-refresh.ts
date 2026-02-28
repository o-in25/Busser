import { invalidateAll } from '$app/navigation';
import { haptics } from '$lib/haptics';
import type { Action } from 'svelte/action';

const THRESHOLD = 80;
const MAX_PULL = 140;

export const pullToRefresh: Action<HTMLElement> = (node) => {
	const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const indicator = document.createElement('div');
	indicator.className = 'ptr-indicator';
	indicator.innerHTML = '<div class="ptr-spinner"></div>';
	node.prepend(indicator);

	let startY = 0;
	let pulling = false;
	let refreshing = false;

	function onTouchStart(e: TouchEvent) {
		if (refreshing || window.scrollY > 0) return;
		startY = e.touches[0].clientY;
		pulling = true;
	}

	function onTouchMove(e: TouchEvent) {
		if (!pulling) return;
		const dy = Math.min(e.touches[0].clientY - startY, MAX_PULL);
		if (dy < 0) return;

		// prevent native scroll while pulling
		if (dy > 10) e.preventDefault();

		const progress = Math.min(dy / THRESHOLD, 1);
		indicator.style.transform = `translateY(${dy * 0.5}px)`;
		indicator.style.opacity = String(progress);

		const spinner = indicator.firstElementChild as HTMLElement;
		if (spinner) {
			spinner.style.transform = prefersReduced ? 'none' : `rotate(${dy * 2}deg)`;
		}

		if (progress >= 1) {
			indicator.classList.add('ptr-ready');
		} else {
			indicator.classList.remove('ptr-ready');
		}
	}

	function onTouchEnd() {
		if (!pulling) return;
		pulling = false;

		if (indicator.classList.contains('ptr-ready')) {
			haptics.medium();
			refreshing = true;
			indicator.classList.remove('ptr-ready');
			indicator.classList.add('ptr-refreshing');
			indicator.style.transform = `translateY(${THRESHOLD * 0.5}px)`;

			invalidateAll().finally(() => {
				refreshing = false;
				indicator.classList.remove('ptr-refreshing');
				indicator.style.transform = '';
				indicator.style.opacity = '0';
			});
		} else {
			indicator.style.transform = '';
			indicator.style.opacity = '0';
		}
	}

	node.addEventListener('touchstart', onTouchStart, { passive: true });
	node.addEventListener('touchmove', onTouchMove, { passive: false });
	node.addEventListener('touchend', onTouchEnd, { passive: true });

	return {
		destroy() {
			node.removeEventListener('touchstart', onTouchStart);
			node.removeEventListener('touchmove', onTouchMove);
			node.removeEventListener('touchend', onTouchEnd);
			indicator.remove();
		},
	};
};
