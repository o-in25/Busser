<script lang="ts">
	import { CheckCircle2, Package, XCircle } from 'lucide-svelte';

	import { goto } from '$app/navigation';
	import type { InventoryStats } from '$lib/types';

	let { stats, showStock = true }: { stats: InventoryStats; showStock?: boolean } = $props();

	function applyFilter(stockFilter: string) {
		const params = new URLSearchParams();
		params.set('page', '1');
		if (stockFilter !== 'all') {
			params.set('stockFilter', stockFilter);
		}
		goto(`/inventory?${params.toString()}`);
	}
</script>

<div class="rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-8 mt-4 px-4 py-4 sm:px-6 sm:py-5">
	<h1 class="text-2xl font-bold mb-3">Inventory</h1>
	<div class="flex gap-2 overflow-x-auto sm:flex-wrap scrollbar-hide snap-x snap-mandatory pb-1 -mb-1">
		<button
			onclick={() => applyFilter('all')}
			class="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border hover:border-primary/50 transition-colors whitespace-nowrap snap-start shrink-0 cursor-pointer"
		>
			<Package class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">{stats.total}</span>
			<span class="text-xs text-muted-foreground">Products</span>
		</button>

		{#if showStock}
			<button
				onclick={() => applyFilter('in-stock')}
				class="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border hover:border-neon-green-500/50 transition-colors whitespace-nowrap snap-start shrink-0 cursor-pointer"
			>
				<CheckCircle2 class="h-4 w-4 text-neon-green-500 shrink-0" />
				<span class="text-sm font-bold">{stats.inStock}</span>
				<span class="text-xs text-muted-foreground">In Stock</span>
			</button>

			<button
				onclick={() => applyFilter('out-of-stock')}
				class="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border hover:border-red-500/50 transition-colors whitespace-nowrap snap-start shrink-0 cursor-pointer"
			>
				<XCircle class="h-4 w-4 text-red-500 shrink-0" />
				<span class="text-sm font-bold">{stats.outOfStock}</span>
				<span class="text-xs text-muted-foreground">Out of Stock</span>
			</button>
		{/if}
	</div>
</div>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
