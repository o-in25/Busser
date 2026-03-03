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

	// preload image off-screen so the browser fully decodes it
	// before we ever add an <img> to the DOM
	$effect(() => {
		if (!src) return;
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
		<div class="absolute inset-0 animate-pulse bg-muted"></div>
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
