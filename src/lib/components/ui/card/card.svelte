<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	// `bare` = transparent container (no frost). use it for a SECTION that itself holds
	// cards — stacking glass-card inside glass-card blurs the page mesh to flat white
	let {
		class: className,
		bare = false,
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & { bare?: boolean; children?: Snippet } = $props();
</script>

<div
	class={cn(
		bare ? 'text-card-foreground' : 'glass-card text-card-foreground isolate',
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
