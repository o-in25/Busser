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

<tfoot
	class={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</tfoot>
