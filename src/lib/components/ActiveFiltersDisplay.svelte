<script lang="ts">
	import { X } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import type { CategoryGroupCount, Supplier } from '$lib/types';

	let {
		search,
		categoryGroupId,
		supplierId = 'all',
		stockFilter,
		categories,
		suppliers = [],
		showStock = true,
		onClearSearch,
		onClearCategory,
		onClearSupplier,
		onClearStockFilter,
		onClearAll,
	}: {
		search: string;
		categoryGroupId: string;
		supplierId?: string;
		stockFilter: string;
		categories: CategoryGroupCount[];
		suppliers?: Supplier[];
		showStock?: boolean;
		onClearSearch: () => void;
		onClearCategory: () => void;
		onClearSupplier?: () => void;
		onClearStockFilter: () => void;
		onClearAll: () => void;
	} = $props();

	const hasSearch = $derived(!!search);
	const hasCategory = $derived(!!categoryGroupId && categoryGroupId !== 'all');
	const hasSupplier = $derived(!!supplierId && supplierId !== 'all');
	const hasStockFilter = $derived(showStock && !!stockFilter && stockFilter !== 'all');
	const hasActiveFilters = $derived(hasSearch || hasCategory || hasSupplier || hasStockFilter);

	const categoryName = $derived(
		hasCategory
			? categories.find((c) => String(c.categoryGroupId) === categoryGroupId)?.categoryGroupName ||
					categoryGroupId
			: ''
	);

	const supplierName = $derived(
		hasSupplier
			? suppliers.find((s) => String(s.supplierId) === supplierId)?.supplierName || supplierId
			: ''
	);

	const stockFilterLabels: Record<string, string> = {
		'in-stock': 'In Stock',
		'out-of-stock': 'Out of Stock',
	};
</script>

{#if hasActiveFilters}
	<div class="flex flex-wrap items-center gap-2 mb-6">
		<span class="text-sm text-muted-foreground">Active filters:</span>

		{#if hasSearch}
			<Badge variant="secondary" class="gap-1">
				Search: "{search}"
				<button onclick={onClearSearch} class="ml-1 hover:text-destructive">
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/if}

		{#if hasCategory}
			<Badge variant="secondary" class="gap-1">
				Category: {categoryName}
				<button onclick={onClearCategory} class="ml-1 hover:text-destructive">
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/if}

		{#if hasSupplier}
			<Badge variant="secondary" class="gap-1">
				Supplier: {supplierName}
				<button onclick={onClearSupplier} class="ml-1 hover:text-destructive">
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/if}

		{#if hasStockFilter}
			<Badge variant="secondary" class="gap-1">
				Stock: {stockFilterLabels[stockFilter] || stockFilter}
				<button onclick={onClearStockFilter} class="ml-1 hover:text-destructive">
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/if}

		<button
			onclick={onClearAll}
			class="text-sm text-muted-foreground hover:text-foreground underline"
		>
			Clear all
		</button>
	</div>
{/if}
