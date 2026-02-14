<script lang="ts">
	import { X } from 'lucide-svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';

	let { src, onclose }: { src: string; onclose: () => void } = $props();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	class="fixed inset-0 z-[9999] flex items-center justify-center"
	role="dialog"
	aria-modal="true"
	aria-label="Image lightbox"
>
	<button
		type="button"
		class="absolute inset-0 bg-background/95 backdrop-blur-md cursor-zoom-out"
		onclick={onclose}
		aria-label="Close lightbox"
		transition:fade={{ duration: 200 }}
	></button>

	<button
		type="button"
		class="absolute top-4 right-4 z-10 p-3 rounded-full bg-muted/50 hover:bg-muted text-foreground transition-colors"
		onclick={onclose}
		aria-label="Close"
		transition:fade={{ duration: 200, delay: 100 }}
	>
		<X class="w-6 h-6" />
	</button>

	<div
		class="relative max-w-[90vw] max-h-[85vh] cursor-zoom-out"
		transition:scale={{ duration: 300, easing: cubicOut, start: 0.9 }}
	>
		<button type="button" onclick={onclose} class="block" aria-label="Close lightbox">
			<img
				class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
				{src}
				alt="Full preview"
			/>
		</button>
	</div>
</div>
