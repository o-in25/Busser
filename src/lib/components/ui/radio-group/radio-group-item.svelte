<script lang="ts">
	import { Circle } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	import { cn } from '$lib/utils';

	let {
		class: className,
		value,
		disabled = false,
		id,
		...restProps
	}: {
		class?: string;
		value: string;
		disabled?: boolean;
		id?: string;
		[key: string]: unknown;
	} = $props();

	const { selectedValue, select } = getContext<{
		selectedValue: Writable<string>;
		select: (val: string) => void;
	}>('radioGroup');

	let isSelected = $derived($selectedValue === value);

	function handleClick() {
		if (disabled) return;
		select(value);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			select(value);
		}
	}
</script>

<button
	type="button"
	role="radio"
	aria-checked={isSelected}
	{disabled}
	{id}
	class={cn(
		'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		isSelected && 'bg-primary',
		className
	)}
	onclick={handleClick}
	onkeydown={handleKeydown}
	{...restProps}
>
	{#if isSelected}
		<Circle class="h-2.5 w-2.5 fill-primary-foreground text-primary-foreground mx-auto" />
	{/if}
</button>
