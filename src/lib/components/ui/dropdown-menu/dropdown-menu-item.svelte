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
		'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
		inset && 'pl-8',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.Item>
