<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { children?: Snippet } = $props();
</script>

<div
	class={cn(
		'rounded-xl border border-white/20 dark:border-zinc-700/30 bg-white/65 dark:bg-zinc-800/45 backdrop-blur-xl text-card-foreground shadow-lg transition-all duration-300 hover:bg-white/75 dark:hover:bg-zinc-800/55 hover:shadow-xl',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
