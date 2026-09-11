<script lang="ts">
	import { CheckCircle2, Package, XCircle } from 'lucide-svelte';

	import { goto } from '$app/navigation';
	import PageHero from '$lib/components/PageHero.svelte';
	import StatBadge from '$lib/components/StatBadge.svelte';
	import type { InventoryStats } from '$lib/types';

	let {
		stats,
		showStock = true,
		activeFilter = 'all',
	}: { stats: InventoryStats; showStock?: boolean; activeFilter?: string } = $props();

	function applyFilter(stockFilter: string) {
		const params = new URLSearchParams();
		params.set('page', '1');
		if (stockFilter !== 'all') {
			params.set('stockFilter', stockFilter);
		}
		goto(`/inventory?${params.toString()}`);
	}
</script>

<PageHero title="Inventory" subtitle="Track what's in your bar and see what's running low.">
	<div class="flex gap-2 flex-wrap pb-1 -mb-1">
		<StatBadge
			as="button"
			variant={activeFilter === 'all' ? 'primary' : 'default'}
			aria-pressed={activeFilter === 'all'}
			onclick={() => applyFilter('all')}
			class="whitespace-nowrap"
		>
			<Package class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">{stats.total}</span>
			<span class="text-xs text-muted-foreground">All</span>
		</StatBadge>

		{#if showStock}
			<StatBadge
				as="button"
				variant={activeFilter === 'in-stock' ? 'primary' : 'default'}
				aria-pressed={activeFilter === 'in-stock'}
				onclick={() => applyFilter('in-stock')}
				class="whitespace-nowrap"
			>
				<CheckCircle2 class="h-4 w-4 text-neon-green-500 shrink-0" />
				<span class="text-sm font-bold">{stats.inStock}</span>
				<span class="text-xs text-muted-foreground">In Stock</span>
			</StatBadge>

			<StatBadge
				as="button"
				variant={activeFilter === 'out-of-stock' ? 'primary' : 'default'}
				aria-pressed={activeFilter === 'out-of-stock'}
				onclick={() => applyFilter('out-of-stock')}
				class="whitespace-nowrap"
			>
				<XCircle class="h-4 w-4 text-red-500 shrink-0" />
				<span class="text-sm font-bold">{stats.outOfStock}</span>
				<span class="text-xs text-muted-foreground">Out of Stock</span>
			</StatBadge>
		{/if}
	</div>
</PageHero>
