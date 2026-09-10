<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	// value is a string in single mode, a string[] in multiple mode
	let {
		value = $bindable(),
		onValueChange,
		type = 'single',
		children,
		...restProps
	}: {
		value?: string | string[];
		onValueChange?: (value: any) => void;
		type?: 'single' | 'multiple';
		children?: Snippet;
		[key: string]: unknown;
	} = $props();
</script>

{#if type === 'single'}
	<SelectPrimitive.Root
		type="single"
		bind:value={() => value as string | undefined, (v) => (value = v)}
		onValueChange={onValueChange as any}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</SelectPrimitive.Root>
{:else}
	<SelectPrimitive.Root
		type="multiple"
		bind:value={() => value as string[] | undefined, (v) => (value = v)}
		onValueChange={onValueChange as any}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</SelectPrimitive.Root>
{/if}
