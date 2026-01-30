<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLTdAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		class: className,
		children,
		...restProps
	}: HTMLTdAttributes & { children?: Snippet } = $props();
</script>

<td class={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</td>
