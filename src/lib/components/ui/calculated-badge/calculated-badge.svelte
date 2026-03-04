<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		class: className,
		label,
		value,
		unit,
		icon: Icon,
		...restProps
	}: {
		class?: string;
		label: string;
		value: string | number;
		unit?: string;
		icon?: typeof import('lucide-svelte').Calculator;
		[key: string]: unknown;
	} = $props();
</script>

<div
	class={cn(
		'flex items-center gap-1.5 px-2 py-1 rounded-md',
		'bg-gradient-to-r from-primary/8 to-primary/4',
		'border border-primary/15',
		'text-xs',
		className
	)}
	{...restProps}
>
	{#if Icon}
		<Icon class="h-3 w-3 text-primary/60" />
	{/if}
	<span class="text-muted-foreground">{label}:</span>
	<span class="font-semibold text-foreground">
		{value}{#if unit}<span class="text-muted-foreground ml-0.5">{unit}</span>{/if}
	</span>
</div>
