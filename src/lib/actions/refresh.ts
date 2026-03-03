import { invalidateAll } from '$app/navigation';
import { haptics } from '$lib/utils/haptics';
import type { Action } from 'svelte/action';

const THRESHOLD = 80;
const MAX_PULL = 140;
const REFRESH_HOLD = 60;

type State = 'idle' | 'pulling' | 'refreshing' | 'completing';

export const refresh: Action<HTMLElement> = (node) => {
	if (!(navigator as any).standalone) return;

	const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const indicator = document.createElement('div');
	indicator.className = 'ptr-indicator';
	const ticks = Array.from(
		{ length: 12 },
		(_, i) => `<div class="ptr-tick" style="--tick-index:${i}"></div>`
	).join('');
	indicator.innerHTML = `<div class="ptr-spinner">${ticks}</div>`;
	document.body.appendChild(indicator);

	let startY = 0;
	let state: State = 'idle';
	let wasReady = false;
	let currentDy = 0;

	function elastic(raw: number): number {
		return MAX_PULL * (1 - Math.exp(-raw / MAX_PULL));
	}

	function applyTransform(dy: number) {
		currentDy = dy;
		node.style.transform = `translateY(${dy}px)`;
		indicator.style.transform = `translateX(-50%) translateY(${dy - 28}px)`;
	}

	function clearTransitions() {
		node.classList.remove('ptr-releasing', 'ptr-completing');
		indicator.classList.remove('ptr-releasing', 'ptr-completing');
	}

	function onTouchStart(e: TouchEvent) {
		if (state !== 'idle' || window.scrollY > 0) return;
		startY = e.touches[0].clientY;
		state = 'pulling';
		wasReady = false;

		clearTransitions();
		node.style.transition = 'none';
		indicator.style.transition = 'none';
	}

	function onTouchMove(e: TouchEvent) {
		if (state !== 'pulling') return;
		const rawDy = e.touches[0].clientY - startY;
		if (rawDy < 0) return;

		if (rawDy > 10) e.preventDefault();

		const dy = elastic(Math.min(rawDy, MAX_PULL * 3));
		const progress = Math.min(dy / THRESHOLD, 1);
		const isReady = progress >= 1;

		applyTransform(dy);
		indicator.style.opacity = String(Math.min(progress * 1.2, 1));

		const spinner = indicator.firstElementChild as HTMLElement;
		if (spinner && !prefersReduced) {
			spinner.style.transform = `rotate(${dy * 3}deg)`;
		}

		if (isReady && !wasReady) {
			haptics.light();
			indicator.classList.add('ptr-ready');
		} else if (!isReady && wasReady) {
			haptics.light();
			indicator.classList.remove('ptr-ready');
		}
		wasReady = isReady;
	}

	function onTouchEnd() {
		if (state !== 'pulling') return;

		// remove inline no-transition overrides
		node.style.transition = '';
		indicator.style.transition = '';

		if (wasReady) {
			// snap to refresh hold position
			haptics.medium();
			state = 'refreshing';
			indicator.classList.remove('ptr-ready');
			indicator.classList.add('ptr-refreshing');

			node.classList.add('ptr-releasing');
			indicator.classList.add('ptr-releasing');
			applyTransform(REFRESH_HOLD);
			indicator.style.opacity = '1';

			const spinner = indicator.firstElementChild as HTMLElement;
			if (spinner) spinner.style.transform = '';

			invalidateAll().finally(() => {
				state = 'completing';
				indicator.classList.remove('ptr-refreshing');

				// remove releasing, add completing for fade-out
				node.classList.remove('ptr-releasing');
				indicator.classList.remove('ptr-releasing');
				node.classList.add('ptr-completing');
				indicator.classList.add('ptr-completing');

				applyTransform(0);
				indicator.style.opacity = '0';

				function onDone() {
					node.removeEventListener('transitionend', onDone);
					node.classList.remove('ptr-completing');
					indicator.classList.remove('ptr-completing');
					node.style.transform = '';
					indicator.style.transform = '';
					state = 'idle';
				}
				node.addEventListener('transitionend', onDone, { once: true });

				// safety fallback if transitionend doesn't fire
				setTimeout(onDone, 400);
			});
		} else {
			// snap back — below threshold
			state = 'idle';
			node.classList.add('ptr-releasing');
			indicator.classList.add('ptr-releasing');
			applyTransform(0);
			indicator.style.opacity = '0';

			function onSnapBack() {
				node.removeEventListener('transitionend', onSnapBack);
				node.classList.remove('ptr-releasing');
				indicator.classList.remove('ptr-releasing');
				node.style.transform = '';
				indicator.style.transform = '';
			}
			node.addEventListener('transitionend', onSnapBack, { once: true });
			setTimeout(onSnapBack, 450);
		}
	}

	document.addEventListener('touchstart', onTouchStart, { passive: true });
	document.addEventListener('touchmove', onTouchMove, { passive: false });
	document.addEventListener('touchend', onTouchEnd, { passive: true });

	return {
		destroy() {
			document.removeEventListener('touchstart', onTouchStart);
			document.removeEventListener('touchmove', onTouchMove);
			document.removeEventListener('touchend', onTouchEnd);
			indicator.remove();
			node.style.transform = '';
		}
	};
};
