<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	// `bare` = transparent container (no frost). use it for a SECTION that itself holds
	// cards — stacking glass-card inside glass-card blurs the page mesh to flat white
	// hoverable = opt-in lift for clickable cards. treatment = glass intensity (default frosted).
	let {
		class: className,
		bare = false,
		hoverable = false,
		treatment,
		children,
		...restProps
	}: HTMLAttributes<HTMLDivElement> & {
		bare?: boolean;
		hoverable?: boolean;
		treatment?: 'clear' | 'frosted' | 'subtle';
		children?: Snippet;
	} = $props();

	// literal strings so tailwind's scanner emits the utilities (dynamic `glass-${x}` is invisible to it)
	const TREATMENTS = { clear: 'glass-clear', frosted: 'glass-frosted', subtle: 'glass-subtle' };
</script>

<div
	class={cn(
		bare ? 'text-card-foreground' : 'glass-card text-card-foreground isolate',
		hoverable && 'glass-card-hover',
		treatment && TREATMENTS[treatment],
		className
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</div>
