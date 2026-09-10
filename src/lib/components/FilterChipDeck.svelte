<script lang="ts">
	import { X } from 'lucide-svelte';

	import { cn } from '$lib/utils';

	type Option = { id: string | number; label: string; count?: number };

	// collapsed, the deck is a single label chip with the others peeking out behind it (box-shadow
	// stagger). clicking fans them out horizontally; picking one collapses the deck again.
	let {
		label,
		options,
		active = null,
		activeLabel = '',
		dashed = false,
		onSelect,
		class: className = '',
	}: {
		label: string;
		options: Option[];
		active?: string | number | null;
		// shown next to the label while collapsed (e.g. the picked value); empty = nothing
		activeLabel?: string;
		dashed?: boolean;
		onSelect: (id: string | number) => void;
		class?: string;
	} = $props();

	let expanded = $state(false);
</script>

<div class={cn('flex items-center overflow-x-auto scrollbar-none', className)}>
	<!-- label chip: box-shadow fakes two more chips staggered behind it -->
	<button
		class="inline-flex items-center rounded-full h-7 text-xs px-3 bg-background/60 backdrop-blur-sm border border-border/50 shrink-0 whitespace-nowrap cursor-pointer transition-all duration-300 ease-out"
		style={!expanded
			? 'box-shadow: 7px 0 0 -1px hsl(var(--background)), 7px 0 0 0px hsl(var(--border)), 14px 0 0 -1px hsl(var(--background)), 14px 0 0 0px hsl(var(--border)); margin-right: 14px;'
			: 'margin-right: 0;'}
		onclick={() => (expanded = !expanded)}
	>
		{label}
		{#if activeLabel && !expanded}
			<span class="ml-1 text-primary text-[10px]">{activeLabel}</span>
		{/if}
	</button>

	<!-- fan-out chips -->
	{#each options as option}
		<button
			class={cn(
				'inline-flex items-center rounded-full h-7 text-xs border shrink-0 cursor-pointer shadow-sm whitespace-nowrap transition-all duration-300 ease-out',
				dashed && 'border-dashed',
				active === option.id
					? 'glass-primary'
					: 'bg-background/60 backdrop-blur-sm border-border/50',
				expanded ? 'max-w-48 px-3 ml-1.5 opacity-100' : 'max-w-0 px-0 ml-0 opacity-0 overflow-hidden'
			)}
			onclick={() => {
				onSelect(option.id);
				expanded = false;
			}}
		>
			{option.label}
			{#if option.count !== undefined}
				<span class="text-[10px] opacity-60 ml-1">{option.count}</span>
			{/if}
		</button>
	{/each}

	<!-- collapse -->
	<button
		class={cn(
			'inline-flex items-center justify-center rounded-full h-7 border border-border/50 shrink-0 cursor-pointer bg-background/60 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-all duration-300 ease-out',
			expanded ? 'w-7 ml-1.5 opacity-100' : 'w-0 ml-0 opacity-0 overflow-hidden'
		)}
		onclick={() => (expanded = false)}
		aria-label="Collapse {label} filter"
	>
		<X class="h-3 w-3" />
	</button>
</div>
