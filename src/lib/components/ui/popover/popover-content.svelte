<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';

	import { cn } from '$lib/utils';

	let {
		class: className,
		align = 'center',
		sideOffset = 4,
		collisionPadding = 16,
		children,
		onOpenAutoFocus,
		...restProps
	}: PopoverPrimitive.ContentProps & { class?: string } = $props();

	// focus the panel, not the first child (avoids stray focus rings / combobox open-on-focus)
	let contentRef = $state<HTMLElement | null>(null);
	const focusPanel = (e: Event) => {
		e.preventDefault();
		contentRef?.focus();
	};
</script>

<!-- portal to body so the content escapes any clipping/overflow ancestor (e.g. a card),
     which also lets floating-ui measure available space against the viewport -->
<PopoverPrimitive.Portal>
	<PopoverPrimitive.Content
		bind:ref={contentRef}
		tabindex={-1}
		onOpenAutoFocus={onOpenAutoFocus ?? focusPanel}
		{align}
		{sideOffset}
		{collisionPadding}
		class={cn(
			'glass-dropdown z-50 w-72 p-4 text-popover-foreground outline-none',
			'origin-[var(--bits-popover-content-transform-origin)]',
			'data-[state=open]:animate-glass-open data-[state=closed]:animate-glass-close',
			'after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-br after:from-white/10 after:via-transparent after:to-white/5 after:opacity-0 data-[state=open]:after:animate-glass-shimmer after:bg-[length:200%_100%]',
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</PopoverPrimitive.Content>
</PopoverPrimitive.Portal>
