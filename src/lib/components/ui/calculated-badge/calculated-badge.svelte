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
		'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg',
		'bg-gradient-to-r from-primary/10 to-primary/5',
		'border border-primary/20',
		'text-sm',
		className
	)}
	{...restProps}
>
	{#if Icon}
		<Icon class="h-3.5 w-3.5 text-primary/70" />
	{/if}
	<span class="text-muted-foreground">{label}:</span>
	<span class="font-semibold text-foreground">
		{value}{#if unit}<span class="text-muted-foreground ml-0.5">{unit}</span>{/if}
	</span>
</div>
