<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';

	let {
		open = $bindable(false),
		onOpenChange,
		children,
		...restProps
	}: SheetPrimitive.RootProps = $props();
</script>

<SheetPrimitive.Root bind:open {onOpenChange} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</SheetPrimitive.Root>
