<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	import { cn } from '$lib/utils';

	let {
		class: className,
		inset = false,
		children,
		...restProps
	}: DropdownMenuPrimitive.ItemProps & { inset?: boolean } = $props();
</script>

<DropdownMenuPrimitive.Item
	class={cn(
		'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 transition-colors data-[highlighted]:bg-accent/15 data-[highlighted]:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		'animate-glass-item',
		inset && 'pl-8',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.Item>
