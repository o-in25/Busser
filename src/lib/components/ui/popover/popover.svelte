<script lang="ts">
	import { Popover as PopoverPrimitive } from 'bits-ui';

	let { open = $bindable(false), children, ...restProps }: PopoverPrimitive.RootProps = $props();
</script>

<PopoverPrimitive.Root bind:open {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</PopoverPrimitive.Root>
