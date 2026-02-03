<script lang="ts">
	import { cn } from '$lib/utils';
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	let {
		class: className,
		value = $bindable<string>(''),
		onchange,
		children,
		...restProps
	}: {
		class?: string;
		value?: string;
		onchange?: (value: string) => void;
		children?: import('svelte').Snippet;
		[key: string]: unknown;
	} = $props();

	const selectedValue = writable(value);

	// Keep store in sync with prop
	$effect(() => {
		selectedValue.set(value);
	});

	// Provide context for RadioGroup.Item
	setContext('radioGroup', {
		selectedValue,
		select: (val: string) => {
			value = val;
			selectedValue.set(val);
			onchange?.(val);
		},
	});
</script>

<div role="radiogroup" class={cn('grid gap-2', className)} {...restProps}>
	{@render children?.()}
</div>
