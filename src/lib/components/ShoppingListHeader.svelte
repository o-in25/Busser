<script lang="ts">
	import { DollarSign, FlaskConical, ShoppingCart, TrendingUp } from 'lucide-svelte';

	import FancyBadge from '$lib/components/FancyBadge.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import type { InventoryStats, ShoppingListSummary } from '$lib/types';

	let {
		summary,
		stats,
	}: {
		summary: ShoppingListSummary;
		stats: InventoryStats;
	} = $props();

	const progress = $derived(stats.total > 0 ? Math.round((stats.inStock / stats.total) * 100) : 0);
</script>

<PageHero title="Shopping List">
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

	<div class="flex gap-2 flex-wrap pb-1 -mb-1">
		<FancyBadge class="whitespace-nowrap">
			<ShoppingCart class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">{stats.outOfStock}</span>
			<span class="text-xs text-muted-foreground">To Restock</span>
		</FancyBadge>

		<FancyBadge class="whitespace-nowrap">
			<DollarSign class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">${summary.totalEstimatedCost.toFixed(2)}</span>
			<span class="text-xs text-muted-foreground">Est. Cost</span>
		</FancyBadge>

		<FancyBadge class="whitespace-nowrap">
			<FlaskConical class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">{summary.totalRecipesUnlockable}</span>
			<span class="text-xs text-muted-foreground">Recipes Unlocked</span>
		</FancyBadge>

		<FancyBadge class="whitespace-nowrap">
			<TrendingUp class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">{summary.bySupplier.length}</span>
			<span class="text-xs text-muted-foreground">Suppliers</span>
		</FancyBadge>
	</div>
</PageHero>
