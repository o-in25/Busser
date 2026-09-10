<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';

	import { cn } from '$lib/utils';

	let { class: className, ...restProps }: SheetPrimitive.OverlayProps = $props();
</script>

<SheetPrimitive.Overlay
	class={cn(
		'glass-scrim fixed inset-0 z-50 touch-none overscroll-none data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
		className
	)}
	{...restProps}
/>
