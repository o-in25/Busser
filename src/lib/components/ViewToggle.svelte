<script lang="ts">
	import { LayoutGrid, List, TableIcon } from 'lucide-svelte';

	import { cn } from '$lib/utils';

	type ViewMode = 'table' | 'grid' | 'list';

	let {
		modes,
		active,
		onchange,
	}: {
		modes: ViewMode[];
		active: ViewMode;
		onchange: (mode: any) => void;
	} = $props();

	const icons: Record<ViewMode, typeof TableIcon> = {
		table: TableIcon,
		grid: LayoutGrid,
		list: List,
	};

	// uniform-width cells let the puck slide by index instead of measuring geometry
	const activeIndex = $derived(modes.indexOf(active));
</script>

<div class="glass-track hidden sm:flex relative items-center rounded-lg p-1">
	<!-- sliding pink puck (glasscn segmented-control feel, on-brand tint) -->
	{#if activeIndex >= 0}
		<span
			class="glass-primary pointer-events-none absolute top-1 left-1 h-10 w-10 rounded-md"
			style="transform: translateX({activeIndex *
				100}%); transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);"
			aria-hidden="true"
		></span>
	{/if}

	{#each modes as mode}
		{@const Icon = icons[mode]}
		<button
			class={cn(
				'relative z-10 h-10 w-10 flex items-center justify-center rounded-md transition-colors',
				active === mode ? 'text-primary-foreground' : 'text-muted-foreground hover:text-primary'
			)}
			onclick={() => onchange(mode)}
			aria-label="{mode} view"
			aria-pressed={active === mode}
		>
			<Icon class="h-4 w-4" />
		</button>
	{/each}
</div>
