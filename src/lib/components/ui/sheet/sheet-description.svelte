<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';

	import { cn } from '$lib/utils';

	let { class: className, children, ...restProps }: SheetPrimitive.DescriptionProps = $props();
</script>

<SheetPrimitive.Description class={cn('text-sm text-muted-foreground', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</SheetPrimitive.Description>
