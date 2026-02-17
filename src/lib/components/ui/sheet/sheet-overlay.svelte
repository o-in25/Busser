<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';

	import { cn } from '$lib/utils';

	let { class: className, ...restProps }: SheetPrimitive.OverlayProps = $props();
</script>

<SheetPrimitive.Overlay
	class={cn(
		'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
		className
	)}
	{...restProps}
/>
