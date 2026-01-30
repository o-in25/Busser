<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	let {
		class: className,
		options,
		value = $bindable(),
		label,
		onselect,
		...restProps
	}: {
		class?: string;
		options: { label: string; value: string | number }[];
		value?: string | number;
		label?: string;
		onselect?: (value: string | number) => void;
		[key: string]: unknown;
	} = $props();

	function handleSelect(optionValue: string | number) {
		value = optionValue;
		onselect?.(optionValue);
	}
</script>

<div class={cn('flex flex-wrap gap-1.5', className)} {...restProps}>
	{#if label}
		<span class="text-xs text-muted-foreground mr-1 self-center">{label}</span>
	{/if}
	{#each options as option}
		<Button
			type="button"
			variant={String(value) === String(option.value) ? 'default' : 'outline'}
			size="sm"
			class={cn(
				'h-7 px-2.5 text-xs font-medium transition-all',
				String(value) === String(option.value)
					? 'ring-2 ring-primary/30'
					: 'hover:bg-primary/10 hover:border-primary/50'
			)}
			onclick={() => handleSelect(option.value)}
		>
			{option.label}
		</Button>
	{/each}
</div>
