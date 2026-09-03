<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils';

	let {
		class: className,
		children,
		...restProps
	}: SelectPrimitive.GroupHeadingProps & { class?: string; children?: Snippet } = $props();
</script>

<SelectPrimitive.GroupHeading
	class={cn('px-3 py-1.5 text-sm font-semibold text-muted-foreground', className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</SelectPrimitive.GroupHeading>
