<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { X } from 'lucide-svelte';

	import { cn } from '$lib/utils';

	import DialogOverlay from './dialog-overlay.svelte';
	import DialogPortal from './dialog-portal.svelte';

	let { class: className, children, ...restProps }: DialogPrimitive.ContentProps = $props();
</script>

<DialogPortal>
	<DialogOverlay />
	<DialogPrimitive.Content
		class={cn(
			'fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] max-w-lg max-h-[85vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border border-white/20 dark:border-zinc-600/25 bg-white/90 dark:bg-zinc-900/60 backdrop-blur-2xl backdrop-saturate-150 p-6 shadow-2xl dark:shadow-[0_0_40px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]',
			'data-[state=open]:animate-glass-dialog-open data-[state=closed]:animate-glass-dialog-close',
			'after:pointer-events-none after:absolute after:inset-0 after:rounded-2xl after:bg-gradient-to-br after:from-white/10 after:via-transparent after:to-white/5 after:opacity-0 data-[state=open]:after:animate-glass-shimmer after:bg-[length:200%_100%]',
			className
		)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
		<DialogPrimitive.Close
			class="absolute right-4 top-4 rounded-full p-1 text-muted-foreground opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
		>
			<X class="h-4 w-4" />
			<span class="sr-only">Close</span>
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</DialogPortal>
