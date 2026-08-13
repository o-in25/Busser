<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		src = null,
		name,
		class: className,
	}: { src?: string | null; name: string; class?: string } = $props();

	// bad/expired image urls exist in the data — fall back to the initial tile on error
	let errored = $state(false);
	$effect(() => {
		src; // reset when the source changes
		errored = false;
	});

	const initial = $derived((name || '?').trim().charAt(0).toUpperCase());
</script>

<div class={cn('overflow-hidden', className)}>
	{#if src && !errored}
		<img {src} alt={name} class="h-full w-full object-cover" onerror={() => (errored = true)} />
	{:else}
		<div
			class="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-primary/5 font-semibold text-primary/80"
		>
			{initial}
		</div>
	{/if}
</div>
