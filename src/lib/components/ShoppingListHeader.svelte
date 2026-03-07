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

<div
	class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-8"
>
	<div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
	<div class="relative px-6 py-8 md:py-10">
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div>
				<h1 class="text-3xl md:text-4xl font-bold mb-2">Shopping List</h1>
				<p class="text-muted-foreground">
					{#if stats.outOfStock === 0 && stats.total > 0}
						All stocked up!
					{:else}
						{stats.outOfStock} item{stats.outOfStock !== 1 ? 's' : ''} to restock
					{/if}
				</p>
			</div>
		</div>

		{#if stats.total > 0}
			<!-- progress bar -->
			<div class="mt-4 mb-6">
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

		<!-- stats -->
		<div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
			<div
				class="flex flex-col items-center gap-2 py-3 md:flex-row md:gap-3 md:px-4 md:py-2 rounded-lg bg-background/80 backdrop-blur-sm border"
			>
				<div
					class="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 shrink-0"
				>
					<ShoppingCart class="h-4 w-4 md:h-5 md:w-5 text-primary" />
				</div>
				<div class="text-center md:text-left">
					<p class="text-lg md:text-xl font-bold">{stats.outOfStock}</p>
					<p class="text-[10px] md:text-xs text-muted-foreground">Items</p>
				</div>
			</div>

			<div
				class="flex flex-col items-center gap-2 py-3 md:flex-row md:gap-3 md:px-4 md:py-2 rounded-lg bg-background/80 backdrop-blur-sm border"
			>
				<div
					class="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-neon-green-500/10 shrink-0"
				>
					<DollarSign class="h-4 w-4 md:h-5 md:w-5 text-neon-green-500" />
				</div>
				<div class="text-center md:text-left">
					<p class="text-lg md:text-xl font-bold">
						${summary.totalEstimatedCost.toFixed(2)}
					</p>
					<p class="text-[10px] md:text-xs text-muted-foreground">Est. Cost</p>
				</div>
			</div>

			<div
				class="flex flex-col items-center gap-2 py-3 md:flex-row md:gap-3 md:px-4 md:py-2 rounded-lg bg-background/80 backdrop-blur-sm border"
			>
				<div
					class="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-purple-500/10 shrink-0"
				>
					<FlaskConical class="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
				</div>
				<div class="text-center md:text-left">
					<p class="text-lg md:text-xl font-bold">{summary.totalRecipesUnlockable}</p>
					<p class="text-[10px] md:text-xs text-muted-foreground">Recipes Unlocked</p>
				</div>
			</div>

			<div
				class="flex flex-col items-center gap-2 py-3 md:flex-row md:gap-3 md:px-4 md:py-2 rounded-lg bg-background/80 backdrop-blur-sm border"
			>
				<div
					class="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-orange-500/10 shrink-0"
				>
					<TrendingUp class="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
				</div>
				<div class="text-center md:text-left">
					<p class="text-lg md:text-xl font-bold">{summary.bySupplier.length}</p>
					<p class="text-[10px] md:text-xs text-muted-foreground">Suppliers</p>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.bg-grid-pattern {
		background-image: radial-gradient(circle, currentColor 1px, transparent 1px);
		background-size: 24px 24px;
	}
</style>
