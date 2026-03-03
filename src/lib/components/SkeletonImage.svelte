<script lang="ts">
	import ImagePlaceholder from '$lib/components/ImagePlaceholder.svelte';
	import { cn } from '$lib/utils';

	let {
		src,
		alt,
		variant = 'recipe',
		class: className = '',
		imgClass = '',
	}: {
		src?: string | null;
		alt: string;
		variant?: 'recipe' | 'product';
		class?: string;
		imgClass?: string;
	} = $props();

	let loaded = $state(false);
	let errored = $state(false);
	let prevSrc: string | null | undefined = undefined;

	// preload image off-screen so the browser fully decodes it
	// before we ever add an <img> to the DOM
	$effect(() => {
		if (!src) return;

		// only reset when src actually changes to a different url
		if (src === prevSrc) return;
		prevSrc = src;

		loaded = false;
		errored = false;

		const img = new Image();
		img.onload = () => (loaded = true);
		img.onerror = () => (errored = true);
		img.src = src;
	});

	const showImage = $derived(!!src && !errored);
</script>

<div class={cn('relative overflow-hidden', className)}>
	{#if showImage && !loaded}
		<div class="absolute inset-0 bg-muted skeleton-delayed"></div>
	{/if}

	{#if showImage && loaded}
		<img
			{src}
			{alt}
			class={cn('h-full w-full object-cover', imgClass)}
		/>
	{:else if !showImage}
		<ImagePlaceholder {variant} class="w-20 h-20" />
	{/if}
</div>
