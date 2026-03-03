<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	let {
		open = $bindable(false),
		onOpenChange,
		children,
		...restProps
	}: DialogPrimitive.RootProps = $props();

	// lock body scroll on mobile when dialog is open
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

<DialogPrimitive.Root bind:open {onOpenChange} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</DialogPrimitive.Root>
