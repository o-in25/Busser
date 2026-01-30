<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & { children?: Snippet } = $props();
</script>

<span
	class={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</span>
