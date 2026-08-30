<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { X } from 'lucide-svelte';

	const DISMISS_KEY = 'pwa-install-dismissed';

	let show = false;

	// ios safari is the only place a2hs works — everything else renders nothing
	function shouldShow(): boolean {
		if (localStorage.getItem(DISMISS_KEY)) return false;

		const ua = navigator.userAgent;

		// ipad in desktop mode reports a mac UA, so also treat touch-capable macs as ios
		const isIos = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
		if (!isIos) return false;

		// in-app webviews and non-safari ios browsers can't add to home screen
		const isWebview = /CriOS|FxiOS|EdgiOS|GSA|FBAN|FBAV|Instagram|Line|MicroMessenger/.test(ua);
		if (isWebview) return false;

		const standalone =
			(navigator as Navigator & { standalone?: boolean }).standalone === true ||
			window.matchMedia('(display-mode: standalone)').matches;
		if (standalone) return false;

		return true;
	}

	function dismiss() {
		localStorage.setItem(DISMISS_KEY, '1');
		show = false;
	}

	onMount(() => {
		if (!shouldShow()) return;
		// small delay so we don't slam a first-time visitor mid-load
		const t = setTimeout(() => (show = true), 3000);
		return () => clearTimeout(t);
	});
</script>

{#if show}
	<div
		class="fixed inset-x-0 z-50 flex justify-center px-3"
		style="bottom: calc(env(safe-area-inset-bottom, 0px) + 5.5rem)"
		transition:fly={{ y: 24, duration: 300 }}
	>
		<div
			class="relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border border-white/25 bg-white/60 p-4 shadow-lg backdrop-blur-xl backdrop-saturate-150 dark:border-zinc-700/40 dark:bg-zinc-800/50"
		>
			<div class="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
				<!-- ios share glyph -->
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="h-5 w-5"
					aria-hidden="true"
				>
					<path d="M12 3v13" />
					<path d="m8 7 4-4 4 4" />
					<path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
				</svg>
			</div>

			<p class="min-w-0 flex-1 text-sm leading-snug">
				<span class="font-semibold">Install Busser</span> — tap the Share icon, then
				<span class="font-semibold">Add to Home Screen</span>.
			</p>

			<button
				type="button"
				onclick={dismiss}
				aria-label="Dismiss"
				class="shrink-0 rounded-full p-1 text-zinc-500 transition-colors hover:bg-black/5 hover:text-zinc-800 dark:hover:bg-white/10 dark:hover:text-zinc-100"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	</div>
{/if}
