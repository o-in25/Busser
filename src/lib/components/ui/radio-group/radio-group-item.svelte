<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	import { cn } from '$lib/utils';

	let {
		class: className,
		value,
		disabled = false,
		id,
		children,
		...restProps
	}: {
		class?: string;
		value: string;
		disabled?: boolean;
		id?: string;
		children?: import('svelte').Snippet;
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
		'flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
		isSelected
			? 'bg-primary text-primary-foreground shadow-sm'
			: 'text-muted-foreground hover:text-foreground',
		className
	)}
	onclick={handleClick}
	onkeydown={handleKeydown}
	{...restProps}
>
	{@render children?.()}
</button>
