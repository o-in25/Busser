<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	import { cn } from '$lib/utils';

	let {
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLParagraphElement> & { children?: Snippet } = $props();
</script>

<div class={cn('text-sm [&_p]:leading-relaxed', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</div>
