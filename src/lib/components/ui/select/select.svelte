<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	let {
		value = $bindable<string | undefined>(undefined),
		onValueChange,
		type = 'single',
		children,
		...restProps
	}: {
		value?: string;
		onValueChange?: (value: string) => void;
		type?: 'single' | 'multiple';
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

{#if type === 'single'}
	<SelectPrimitive.Root
		type="single"
		bind:value
		onValueChange={onValueChange as any}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</SelectPrimitive.Root>
{:else}
	<SelectPrimitive.Root type="multiple" {...restProps}>
		{#if children}
			{@render children()}
		{/if}
	</SelectPrimitive.Root>
{/if}
