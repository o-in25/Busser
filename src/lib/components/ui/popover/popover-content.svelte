<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';

	import { cn } from '$lib/utils';

	let {
		class: className,
		align = 'center',
		sideOffset = 4,
		children,
		...restProps
	}: PopoverPrimitive.ContentProps & { class?: string } = $props();
</script>

<PopoverPrimitive.Content
	{align}
	{sideOffset}
	class={cn(
		'z-50 w-72 rounded-xl border border-white/30 dark:border-zinc-700/40 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl p-4 text-popover-foreground shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</PopoverPrimitive.Content>
