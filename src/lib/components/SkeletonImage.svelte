<script lang="ts">
	import ImagePlaceholder from '$lib/components/ImagePlaceholder.svelte';
	import { cn } from '$lib/utils';
	import { cdnSrc, cdnSrcset } from '$lib/utils/image';

	let {
		src,
		alt,
		variant = 'recipe',
		class: className = '',
		imgClass = '',
		transitionName = '',
		sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px',
	}: {
		src?: string | null;
		alt: string;
		variant?: 'recipe' | 'product';
		class?: string;
		imgClass?: string;
		transitionName?: string;
		sizes?: string;
	} = $props();

	// resized variants served from the cloudflare edge; passes non-gcs urls through
	const srcset = $derived(cdnSrcset(src));
	const displaySrc = $derived(src ? cdnSrc(src, 768) : src);

	let loaded = $state(false);
	let errored = $state(false);
	let prevSrc: string | null | undefined = undefined;

	// preload image off-screen so the browser fully decodes it
	// before we ever add an <img> to the DOM. mirror srcset/sizes so it
	// preloads the same variant the <img> will pick.
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
		if (srcset) {
			img.sizes = sizes;
			img.srcset = srcset;
		}
		img.src = displaySrc as string;
	});

	const showImage = $derived(!!src && !errored);
</script>

<div
	class={cn('relative overflow-hidden', className)}
	style={transitionName ? `view-transition-name: ${transitionName}` : undefined}
>
	{#if showImage && !loaded}
		<div class="absolute inset-0 bg-muted skeleton-delayed"></div>
	{/if}

	{#if showImage && loaded}
		<img
			src={displaySrc}
			{srcset}
			{sizes}
			{alt}
			class={cn('h-full w-full object-cover', imgClass)}
		/>
	{:else if !showImage}
		<ImagePlaceholder {variant} class="w-20 h-20" />
	{/if}
</div>
