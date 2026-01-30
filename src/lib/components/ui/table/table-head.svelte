<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLThAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		class: className,
		children,
		...restProps
	}: HTMLThAttributes & { children?: Snippet } = $props();
</script>

<th
	class={cn(
		'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</th>
