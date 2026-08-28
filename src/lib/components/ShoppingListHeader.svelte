<script lang="ts">
	import { DollarSign, FlaskConical, ShoppingCart, TrendingUp } from 'lucide-svelte';

	import PageHero from '$lib/components/PageHero.svelte';
	import StatBadge from '$lib/components/StatBadge.svelte';
	import type { InventoryStats, ShoppingListSummary } from '$lib/types';

	import { workspaceSwitching } from '../../stores';

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
			{#if $workspaceSwitching}
				<!-- stale progress numbers would jump on switch, so shimmer the whole strip -->
				<div class="flex items-center justify-between mb-1.5">
					<span class="shimmer h-4 w-28 rounded-md"></span>
					<span class="shimmer h-4 w-8 rounded-md"></span>
				</div>
				<div class="shimmer h-2 rounded-full" aria-hidden="true"></div>
			{:else}
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
			{/if}
		</div>
	{/if}

	<div class="flex gap-2 flex-wrap pb-1 -mb-1">
		<StatBadge class="whitespace-nowrap">
			<ShoppingCart class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">{stats.outOfStock}</span>
			<span class="text-xs text-muted-foreground">To Restock</span>
		</StatBadge>

		<StatBadge class="whitespace-nowrap">
			<DollarSign class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">${summary.totalEstimatedCost.toFixed(2)}</span>
			<span class="text-xs text-muted-foreground">Est. Cost</span>
		</StatBadge>

		<StatBadge class="whitespace-nowrap">
			<FlaskConical class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">{summary.totalRecipesUnlockable}</span>
			<span class="text-xs text-muted-foreground">Recipes Unlocked</span>
		</StatBadge>

		<StatBadge class="whitespace-nowrap">
			<TrendingUp class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">{summary.bySupplier.length}</span>
			<span class="text-xs text-muted-foreground">Suppliers</span>
		</StatBadge>
	</div>
</PageHero>

<style>
	/* same sweeping highlight as the results skeletons — keeps the switch gesture consistent */
	.shimmer {
		background: linear-gradient(
			90deg,
			hsl(var(--muted)) 25%,
			hsl(var(--muted-foreground) / 0.15) 50%,
			hsl(var(--muted)) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.4s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.shimmer {
			animation: none;
		}
	}
</style>
