<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { Check } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils';

	let {
		class: className,
		value,
		label,
		disabled = false,
		...restProps
	}: SelectPrimitive.ItemProps & { class?: string; label?: string; children?: Snippet } = $props();
</script>

<SelectPrimitive.Item
	{value}
	{disabled}
	class={cn(
		'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-9 text-sm outline-none transition-colors data-[highlighted]:bg-primary/10 data-[highlighted]:text-foreground data-[selected]:bg-primary/15 data-[selected]:font-medium data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
		className
	)}
	{...restProps}
>
	{#snippet children({ selected })}
		{label ?? value}
		<span class="absolute right-2.5 flex h-3.5 w-3.5 items-center justify-center text-primary">
			{#if selected}
				<Check class="h-4 w-4" />
			{/if}
		</span>
	{/snippet}
</SelectPrimitive.Item>
