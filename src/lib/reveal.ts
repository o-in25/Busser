import type { Action } from 'svelte/action';
import type { RevealParams } from './types';

export const reveal: Action<HTMLElement, RevealParams | undefined> = (node, params) => {
	const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (prefersReduced) {
		node.classList.add('revealed');
		return {};
	}

	const delay = params?.delay ?? 0;
	const threshold = params?.threshold ?? 0.15;

	if (delay > 0) {
		node.style.setProperty('--reveal-delay', `${delay}ms`);
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					entry.target.classList.add('revealed');
					observer.unobserve(entry.target);
				}
			}
		},
		{ threshold }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		},
	};
};
