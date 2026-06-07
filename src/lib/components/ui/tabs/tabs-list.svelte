<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';

	import { cn } from '$lib/utils';

	let { class: className, children, ...restProps }: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
	class={cn(
		'inline-flex h-10 items-center justify-center rounded-md border border-white/20 bg-white/40 p-1 text-muted-foreground backdrop-blur-md dark:border-zinc-700/30 dark:bg-zinc-800/40',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</TabsPrimitive.List>
