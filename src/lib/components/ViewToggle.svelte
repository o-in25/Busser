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
	class="hidden sm:flex items-center border border-white/30 dark:border-zinc-700/40 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md rounded-lg overflow-hidden"
>
	{#each modes as mode}
		{@const Icon = icons[mode]}
		<button
			class={cn(
				'h-10 w-10 flex items-center justify-center transition-all',
				active === mode
					? 'bg-primary/25 dark:bg-primary/20 text-primary backdrop-blur-sm ring-1 ring-inset ring-primary/40 shadow-[inset_0_0_12px_rgba(248,78,128,0.35)]'
					: 'text-muted-foreground hover:bg-white/40 dark:hover:bg-zinc-700/40 hover:text-primary'
			)}
			onclick={() => onchange(mode)}
			aria-label="{mode} view"
		>
			<Icon class="h-4 w-4" />
		</button>
	{/each}
</div>
