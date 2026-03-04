<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';

	let {
		open = $bindable(false),
		onOpenChange,
		children,
		...restProps
	}: SheetPrimitive.RootProps = $props();

	// lock body scroll on mobile when sheet is open
	$effect(() => {
		if (typeof document === 'undefined') return;
		if (open) {
			document.documentElement.style.overflow = 'hidden';
		} else {
			document.documentElement.style.overflow = '';
		}
		return () => {
			document.documentElement.style.overflow = '';
		};
	});
</script>

<SheetPrimitive.Root bind:open {onOpenChange} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</SheetPrimitive.Root>
