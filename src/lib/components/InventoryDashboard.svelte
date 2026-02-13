<script lang="ts">
	import { CheckCircle2, Package, XCircle } from 'lucide-svelte';

	import { goto } from '$app/navigation';
	import type { InventoryStats } from '$lib/types';
	import { cn } from '$lib/utils';

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

			<!-- Quick Stats -->
			<div class="grid grid-cols-3 md:flex gap-3">
				<!-- Total -->
				<button
					onclick={() => applyFilter('all')}
					class={cn(
						'flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border',
						'hover:border-primary/50 hover:bg-background transition-colors cursor-pointer',
						'min-w-[120px]'
					)}
				>
					<Package class="h-5 w-5 text-primary shrink-0" />
					<div class="text-left">
						<p class="text-xl font-bold">{stats.total}</p>
						<p class="text-xs text-muted-foreground">Total</p>
					</div>
				</button>

				<!-- In Stock -->
				<button
					onclick={() => applyFilter('in-stock')}
					class={cn(
						'flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border',
						'hover:border-green-500/50 hover:bg-background transition-colors cursor-pointer',
						'min-w-[120px]'
					)}
				>
					<CheckCircle2 class="h-5 w-5 text-green-500 shrink-0" />
					<div class="text-left">
						<p class="text-xl font-bold">{stats.inStock}</p>
						<p class="text-xs text-muted-foreground">In Stock</p>
					</div>
				</button>

				<!-- Out of Stock -->
				<button
					onclick={() => applyFilter('out-of-stock')}
					class={cn(
						'flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border',
						'hover:border-red-500/50 hover:bg-background transition-colors cursor-pointer',
						'min-w-[120px]'
					)}
				>
					<XCircle class="h-5 w-5 text-red-500 shrink-0" />
					<div class="text-left">
						<p class="text-xl font-bold">{stats.outOfStock}</p>
						<p class="text-xs text-muted-foreground">Out of Stock</p>
					</div>
				</button>

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
