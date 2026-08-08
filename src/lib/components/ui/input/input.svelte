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
		'glass-surface flex h-10 w-full px-3 py-2 text-base md:text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground/80 focus-visible:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-white/90 dark:focus:bg-zinc-800/70 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:shadow-glow-cyan',
		className
	)}
	bind:value
	{...restProps}
/>
