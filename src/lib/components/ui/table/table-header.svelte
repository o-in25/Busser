<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLTableSectionElement> & { children?: Snippet } = $props();
</script>

<thead class={cn('[&_tr]:border-b', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</thead>
