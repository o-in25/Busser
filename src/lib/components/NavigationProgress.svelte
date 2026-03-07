<script lang="ts">
	import { beforeNavigate, afterNavigate } from '$app/navigation';

	let {
		color = '#e5195f',
		displayThresholdMs = 150,
	}: {
		color?: string;
		displayThresholdMs?: number;
	} = $props();

	let width = $state(0);
	let running = $state(false);
	let hiding = $state(false);

	let interval: ReturnType<typeof setInterval> | null = null;
	let startTimeout: ReturnType<typeof setTimeout> | null = null;
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;

	function getIncrement(n: number): number {
		if (n < 0.2) return 0.1;
		if (n < 0.5) return 0.04;
		if (n < 0.8) return 0.02;
		if (n < 0.99) return 0.005;
		return 0;
	}

	function start() {
		if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
		hiding = false;
		width = 0.08;
		running = true;
		if (interval) clearInterval(interval);
		interval = setInterval(() => {
			const step = getIncrement(width) + Math.random() * 0.01;
			width = Math.min(width + step, 0.994);
			if (width >= 0.994 && interval) { clearInterval(interval); interval = null; }
		}, 700);
	}

	function complete() {
		if (startTimeout) { clearTimeout(startTimeout); startTimeout = null; }
		if (interval) { clearInterval(interval); interval = null; }
		if (!running) return;
		width = 1;
		running = false;
		hiding = true;
		hideTimeout = setTimeout(() => {
			hiding = false;
			width = 0;
			hideTimeout = null;
		}, 500);
	}

	beforeNavigate((nav) => {
		if (startTimeout) { clearTimeout(startTimeout); startTimeout = null; }
		if (nav.to?.route.id) {
			if (displayThresholdMs > 0) {
				startTimeout = setTimeout(() => start(), displayThresholdMs);
			} else {
				start();
			}
			nav.complete.catch().finally(() => complete());
		}
	});

	afterNavigate(() => complete());
</script>

{#if running || width > 0}
	<div
		class="nav-progress"
		class:hiding
		style="width: {width * 100}%; background-color: {color};"
	>
		<div class="nav-progress-glow" style="color: {color};"></div>
	</div>
{/if}

<style>
	.nav-progress {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 2px;
		transition: width 0.21s ease-in-out;
		z-index: 1;
	}

	.nav-progress.hiding {
		transition: width 0.21s ease-in-out, opacity 0.4s ease;
		opacity: 0;
	}

	.nav-progress-glow {
		position: absolute;
		top: 0;
		right: 0;
		height: 2px;
		width: 80px;
		box-shadow: 0 0 6px currentColor;
	}
</style>
