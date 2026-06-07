<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { ChevronDown } from 'lucide-svelte';

	import { cn } from '$lib/utils';

	let { class: className, children, ...restProps }: SelectPrimitive.TriggerProps = $props();
</script>

<SelectPrimitive.Trigger
	class={cn(
		'glass-surface flex h-10 w-full items-center justify-between px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 focus:bg-white/90 dark:focus:bg-zinc-800/70 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:shadow-glow-cyan [&>span]:line-clamp-1',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
	<ChevronDown class="h-4 w-4 opacity-50" />
</SelectPrimitive.Trigger>
