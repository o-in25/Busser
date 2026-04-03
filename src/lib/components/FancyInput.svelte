<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let {
		class: className,
		value = $bindable(),
		...restProps
	}: HTMLInputAttributes & { value?: string } = $props();
</script>

<input
	class={cn(
		'flex h-10 w-full rounded-full backdrop-blur-xl backdrop-saturate-150 bg-white/50 dark:bg-zinc-800/30 border border-white/30 dark:border-zinc-700/40 shadow-sm px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground/70 focus-visible:outline-none focus:bg-white/70 dark:focus:bg-zinc-800/50 focus:border-primary/40 focus:shadow-md focus:shadow-primary/10 focus:ring-2 focus:ring-primary/20 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
		className
	)}
	bind:value
	{...restProps}
/>
