<script lang="ts">
	import type { InventoryStats } from '$lib/types';
	import { Package, CheckCircle2, XCircle, AlertTriangle } from 'lucide-svelte';

	let { stats }: { stats: InventoryStats } = $props();
</script>

<!-- Header Section with Dashboard Stats -->
<div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-8 mt-4">
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
			<div class="grid grid-cols-2 md:flex gap-3">
				<!-- Total -->
				<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border">
					<Package class="h-5 w-5 text-primary" />
					<div>
						<p class="text-xl font-bold">{stats.total}</p>
						<p class="text-xs text-muted-foreground">Total</p>
					</div>
				</div>

				<!-- In Stock -->
				<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border">
					<CheckCircle2 class="h-5 w-5 text-green-500" />
					<div>
						<p class="text-xl font-bold">{stats.inStock}</p>
						<p class="text-xs text-muted-foreground">In Stock</p>
					</div>
				</div>

				<!-- Out of Stock -->
				<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border">
					<XCircle class="h-5 w-5 text-red-500" />
					<div>
						<p class="text-xl font-bold">{stats.outOfStock}</p>
						<p class="text-xs text-muted-foreground">Out of Stock</p>
					</div>
				</div>

				<!-- Low Stock -->
				<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border">
					<AlertTriangle class="h-5 w-5 text-yellow-500" />
					<div>
						<p class="text-xl font-bold">{stats.lowStock}</p>
						<p class="text-xs text-muted-foreground">Low Stock</p>
					</div>
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
