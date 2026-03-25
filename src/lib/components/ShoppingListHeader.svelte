<script lang="ts">
	import { DollarSign, FlaskConical, ShoppingCart, TrendingUp } from 'lucide-svelte';

	import type { InventoryStats, ShoppingListSummary } from '$lib/types';

	let {
		summary,
		stats,
	}: {
		summary: ShoppingListSummary;
		stats: InventoryStats;
	} = $props();

	const progress = $derived(
		stats.total > 0 ? Math.round((stats.inStock / stats.total) * 100) : 0
	);
</script>

<div class="rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-8 px-4 py-4 sm:px-6 sm:py-5">
	<h1 class="text-2xl font-bold mb-3">Shopping List</h1>

	{#if stats.total > 0}
		<div class="mb-3">
			<div class="flex items-center justify-between text-sm mb-1.5">
				<span class="text-muted-foreground">{stats.inStock} of {stats.total} in stock</span>
				<span class="font-medium">{progress}%</span>
			</div>
			<div class="h-2 rounded-full bg-muted overflow-hidden">
				<div
					class="h-full rounded-full bg-primary transition-all duration-500 ease-out"
					style="width: {progress}%"
				></div>
			</div>
		</div>
	{/if}

	<div class="flex gap-2 overflow-x-auto sm:flex-wrap scrollbar-hide snap-x snap-mandatory pb-1 -mb-1">
		<div class="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border whitespace-nowrap snap-start shrink-0">
			<ShoppingCart class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">{stats.outOfStock}</span>
			<span class="text-xs text-muted-foreground">To Restock</span>
		</div>

		<div class="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border whitespace-nowrap snap-start shrink-0">
			<DollarSign class="h-4 w-4 text-neon-green-500 shrink-0" />
			<span class="text-sm font-bold">${summary.totalEstimatedCost.toFixed(2)}</span>
			<span class="text-xs text-muted-foreground">Est. Cost</span>
		</div>

		<div class="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border whitespace-nowrap snap-start shrink-0">
			<FlaskConical class="h-4 w-4 text-purple-500 shrink-0" />
			<span class="text-sm font-bold">{summary.totalRecipesUnlockable}</span>
			<span class="text-xs text-muted-foreground">Recipes Unlocked</span>
		</div>

		<div class="flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border whitespace-nowrap snap-start shrink-0">
			<TrendingUp class="h-4 w-4 text-orange-500 shrink-0" />
			<span class="text-sm font-bold">{summary.bySupplier.length}</span>
			<span class="text-xs text-muted-foreground">Suppliers</span>
		</div>
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
