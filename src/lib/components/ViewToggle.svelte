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
</script>

<div
	class="glass-control hidden sm:flex items-center rounded-lg overflow-hidden"
>
	{#each modes as mode}
		{@const Icon = icons[mode]}
		<button
			class={cn(
				'h-10 w-10 flex items-center justify-center transition-all',
				active === mode
					? 'glass-primary'
					: 'text-muted-foreground hover:bg-white/40 dark:hover:bg-white/[0.08] hover:text-primary'
			)}
			onclick={() => onchange(mode)}
			aria-label="{mode} view"
		>
			<Icon class="h-4 w-4" />
		</button>
	{/each}
</div>
