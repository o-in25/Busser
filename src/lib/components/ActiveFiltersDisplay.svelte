<script lang="ts">
	import { X } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import type { CategoryCount } from '$lib/types';

	let {
		search,
		categoryId,
		stockFilter,
		categories,
		onClearSearch,
		onClearCategory,
		onClearStockFilter,
		onClearAll,
	}: {
		search: string;
		categoryId: string;
		stockFilter: string;
		categories: CategoryCount[];
		onClearSearch: () => void;
		onClearCategory: () => void;
		onClearStockFilter: () => void;
		onClearAll: () => void;
	} = $props();

	const hasActiveFilters = $derived(!!search || !!categoryId || !!stockFilter);

	const categoryName = $derived(
		categoryId
			? categories.find((c) => String(c.categoryId) === categoryId)?.categoryName || categoryId
			: ''
	);

	const stockFilterLabels: Record<string, string> = {
		'in-stock': 'In Stock',
		'out-of-stock': 'Out of Stock',
		'low-stock': 'Low Stock',
	};
</script>

{#if hasActiveFilters}
	<div class="flex flex-wrap items-center gap-2 mb-6">
		<span class="text-sm text-muted-foreground">Active filters:</span>

		{#if search}
			<Badge variant="secondary" class="gap-1">
				Search: "{search}"
				<button onclick={onClearSearch} class="ml-1 hover:text-destructive">
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/if}

		{#if categoryId}
			<Badge variant="secondary" class="gap-1">
				Category: {categoryName}
				<button onclick={onClearCategory} class="ml-1 hover:text-destructive">
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/if}

		{#if stockFilter}
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
