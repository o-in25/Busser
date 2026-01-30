<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		class: className,
		inset = false,
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { inset?: boolean; children?: Snippet } = $props();
</script>

<div class={cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</div>
