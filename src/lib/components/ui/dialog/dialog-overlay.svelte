<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';

	import { cn } from '$lib/utils';

	let { class: className, ...restProps }: DialogPrimitive.OverlayProps = $props();
</script>

<DialogPrimitive.Overlay
	class={cn(
		'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm touch-none overscroll-none data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out',
		className
	)}
	{...restProps}
/>
