<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	import { cn } from '$lib/utils';

	let {
		class: className,
		sideOffset = 4,
		children,
		...restProps
	}: DropdownMenuPrimitive.ContentProps = $props();
</script>

<DropdownMenuPrimitive.Portal>
	<DropdownMenuPrimitive.Content
		{sideOffset}
		class={cn(
			'z-50 min-w-[8rem] overflow-hidden rounded-xl border border-white/30 dark:border-zinc-700/40 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl backdrop-saturate-150 p-1 text-popover-foreground shadow-2xl',
			'origin-[var(--bits-dropdown-menu-content-transform-origin)]',
			'data-[state=open]:animate-glass-open data-[state=closed]:animate-glass-close',
			'after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:bg-gradient-to-br after:from-white/10 after:via-transparent after:to-white/5 after:opacity-0 data-[state=open]:after:animate-glass-shimmer after:bg-[length:200%_100%]',
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</DropdownMenuPrimitive.Content>
</DropdownMenuPrimitive.Portal>
