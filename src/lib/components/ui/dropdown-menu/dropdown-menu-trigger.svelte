<script lang="ts">
	import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';

	let { children, ...restProps }: DropdownMenuPrimitive.TriggerProps = $props();
</script>

<DropdownMenuPrimitive.Trigger {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</DropdownMenuPrimitive.Trigger>
