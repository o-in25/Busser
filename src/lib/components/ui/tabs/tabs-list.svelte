<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';

	import { cn } from '$lib/utils';

	let { class: className, children, ...restProps }: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
	class={cn(
		'glass-control inline-flex h-10 items-center justify-center rounded-md p-1 text-muted-foreground',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</TabsPrimitive.List>
