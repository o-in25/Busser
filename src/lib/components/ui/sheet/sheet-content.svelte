<script lang="ts">
	import { Dialog as SheetPrimitive } from 'bits-ui';
	import { X } from 'lucide-svelte';

	import { cn } from '$lib/utils';

	import SheetOverlay from './sheet-overlay.svelte';

	type Side = 'top' | 'bottom' | 'left' | 'right';

	let {
		class: className,
		side = 'right',
		children,
		...restProps
	}: SheetPrimitive.ContentProps & { side?: Side } = $props();

	const sideClasses: Record<Side, string> = {
		top: 'inset-x-0 top-0 border-b data-[state=closed]:animate-slide-out-to-top data-[state=open]:animate-slide-in-from-top',
		bottom:
			'inset-x-0 bottom-0 border-t data-[state=closed]:animate-slide-out-to-bottom data-[state=open]:animate-slide-in-from-bottom',
		left: 'inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:animate-slide-out-to-left data-[state=open]:animate-slide-in-from-left sm:max-w-sm',
		right:
			'inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:animate-slide-out-to-right data-[state=open]:animate-slide-in-from-right sm:max-w-sm',
	};
</script>

<SheetPrimitive.Portal>
	<SheetOverlay />
	<SheetPrimitive.Content
		class={cn(
			'fixed z-50 gap-4 bg-white/75 dark:bg-zinc-900/65 backdrop-blur-2xl backdrop-saturate-150 p-6 shadow-2xl border-white/20 dark:border-zinc-700/30',
			sideClasses[side],
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
		<SheetPrimitive.Close
			class="absolute right-4 top-5 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
		>
			<X class="h-5 w-5" />
			<span class="sr-only">Close</span>
		</SheetPrimitive.Close>
	</SheetPrimitive.Content>
</SheetPrimitive.Portal>
