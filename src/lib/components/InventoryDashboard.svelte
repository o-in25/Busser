<script lang="ts">
	import { CheckCircle2, Package, XCircle } from 'lucide-svelte';

	import { goto } from '$app/navigation';
	import type { InventoryStats } from '$lib/types';

	let { stats }: { stats: InventoryStats } = $props();

	function applyFilter(stockFilter: string) {
		const params = new URLSearchParams();
		params.set('page', '1');
		if (stockFilter !== 'all') {
			params.set('stockFilter', stockFilter);
		}
		goto(`/inventory?${params.toString()}`);
	}
</script>

<!-- Header Section with Dashboard Stats -->
<div
	class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-8 mt-4"
>
	<div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
	<div class="relative px-6 py-8 md:py-10">
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div>
				<h1 class="text-3xl md:text-4xl font-bold mb-2">Inventory</h1>
				<p class="text-muted-foreground">
					Manage your {stats.total} products across {stats.categoryBreakdown.length} categories.
				</p>
			</div>
		</div>

		<!-- Quick Stats -->
		<div class="grid grid-cols-3 gap-2 md:gap-3 mt-6">
			<button
				onclick={() => applyFilter('all')}
				class="flex flex-col items-center gap-2 py-3 md:flex-row md:gap-3 md:px-4 md:py-2 rounded-lg bg-background/80 backdrop-blur-sm border hover:border-primary/50 hover:bg-background transition-colors cursor-pointer"
			>
				<div class="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 shrink-0">
					<Package class="h-4 w-4 md:h-5 md:w-5 text-primary" />
				</div>
				<div class="text-center md:text-left">
					<p class="text-lg md:text-xl font-bold">{stats.total}</p>
					<p class="text-[10px] md:text-xs text-muted-foreground">Total</p>
				</div>
			</button>

			<button
				onclick={() => applyFilter('in-stock')}
				class="flex flex-col items-center gap-2 py-3 md:flex-row md:gap-3 md:px-4 md:py-2 rounded-lg bg-background/80 backdrop-blur-sm border hover:border-green-500/50 hover:bg-background transition-colors cursor-pointer"
			>
				<div class="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-green-500/10 shrink-0">
					<CheckCircle2 class="h-4 w-4 md:h-5 md:w-5 text-green-500" />
				</div>
				<div class="text-center md:text-left">
					<p class="text-lg md:text-xl font-bold">{stats.inStock}</p>
					<p class="text-[10px] md:text-xs text-muted-foreground">In Stock</p>
				</div>
			</button>

			<button
				onclick={() => applyFilter('out-of-stock')}
				class="flex flex-col items-center gap-2 py-3 md:flex-row md:gap-3 md:px-4 md:py-2 rounded-lg bg-background/80 backdrop-blur-sm border hover:border-red-500/50 hover:bg-background transition-colors cursor-pointer"
			>
				<div class="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-red-500/10 shrink-0">
					<XCircle class="h-4 w-4 md:h-5 md:w-5 text-red-500" />
				</div>
				<div class="text-center md:text-left">
					<p class="text-lg md:text-xl font-bold">{stats.outOfStock}</p>
					<p class="text-[10px] md:text-xs text-muted-foreground">Out of Stock</p>
				</div>
			</button>
		</div>
	</div>
</div>

<style>
	.bg-grid-pattern {
		background-image: radial-gradient(circle, currentColor 1px, transparent 1px);
		background-size: 24px 24px;
	}
</style>
