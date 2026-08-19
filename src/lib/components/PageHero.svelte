<script lang="ts">
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils';

	// children = hero body (badges, progress, etc.)
	let {
		title,
		subtitle,
		children,
		class: className
	}: {
		title: string;
		subtitle?: string;
		children?: Snippet;
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		'rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-6 px-4 py-4 sm:px-6 sm:py-5',
		className
	)}
>
	<h1 class="text-2xl font-bold">{title}</h1>
	{#if subtitle}
		<p class="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
	{/if}
	{#if children}
		<div class="mt-3">{@render children()}</div>
	{/if}
</div>
