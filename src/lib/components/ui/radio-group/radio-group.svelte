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

<div
	role="radiogroup"
	class={cn(
		'inline-flex w-full gap-1 rounded-lg border border-white/20 bg-white/40 p-1 backdrop-blur-md backdrop-saturate-150 dark:border-white/[0.10] dark:bg-white/[0.08]',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
