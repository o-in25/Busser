<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		placeholder = 'Select an option',
		class: className,
		children,
		...restProps
	}: HTMLAttributes<HTMLSpanElement> & { placeholder?: string; children?: Snippet } = $props();
</script>

<span class={className} {...restProps}>
	{#if children}
		{@render children()}
	{:else}
		<span class="text-muted-foreground">{placeholder}</span>
	{/if}
</span>
