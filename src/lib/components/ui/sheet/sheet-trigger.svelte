<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';

	let { children, ...restProps }: SheetPrimitive.TriggerProps = $props();
</script>

<SheetPrimitive.Trigger {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</SheetPrimitive.Trigger>
