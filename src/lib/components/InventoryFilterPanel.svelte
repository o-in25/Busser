<script lang="ts">
	import { ArrowUpDown, List, Package, Settings2, Tags } from 'lucide-svelte';

	import * as Select from '$lib/components/ui/select';
	import type { CategoryGroupCount } from '$lib/types';

	let {
		categories,
		selectedCategory,
		stockFilter,
		sortOption,
		perPage,
		basePath = '/inventory',
		onCategoryChange,
		onStockFilterChange,
		onSortChange,
		onPerPageChange,
		onReset,
	}: {
		categories: CategoryGroupCount[];
		selectedCategory: string;
		stockFilter: string;
		sortOption: string;
		perPage: string;
		basePath?: string;
		onCategoryChange: (value: string) => void;
		onStockFilterChange: (value: string) => void;
		onSortChange: (value: string) => void;
		onPerPageChange: (value: string) => void;
		onReset: () => void;
	} = $props();

	const stockFilterOptions = [
		{ value: 'all', label: 'All Stock Levels' },
		{ value: 'in-stock', label: 'In Stock' },
		{ value: 'out-of-stock', label: 'Out of Stock' },
	];

	const sortOptions = [
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
	];

	const perPageOptions = [
		{ value: '20', label: '20 per page' },
		{ value: '50', label: '50 per page' },
		{ value: '100', label: '100 per page' },
	];

	const categoryLabel = $derived.by(() => {
		if (!selectedCategory || selectedCategory === 'all') return 'All Categories';
		const cat = categories.find((c) => String(c.categoryGroupId) === selectedCategory);
		return cat ? `${cat.categoryGroupName} (${cat.count})` : 'All Categories';
	});

	const stockFilterLabel = $derived.by(() => {
		const option = stockFilterOptions.find((o) => o.value === stockFilter);
		return option?.label || 'All Stock Levels';
	});

	const sortLabel = $derived.by(() => {
		const option = sortOptions.find((o) => o.value === sortOption);
		return option?.label || 'Name (A-Z)';
	});

	const perPageLabel = $derived.by(() => {
		const option = perPageOptions.find((o) => o.value === perPage);
		return option?.label || '20 per page';
	});

	const hasNonDefaultFilters = $derived(
		(selectedCategory && selectedCategory !== 'all') ||
			(stockFilter && stockFilter !== 'all') ||
			sortOption !== 'name-asc' ||
			perPage !== '20'
	);
</script>

<div class="flex flex-col gap-4">
	<!-- category -->
	<div class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-muted-foreground">Category</span>
		<Select.Root
			type="single"
			value={selectedCategory}
			onValueChange={(v) => onCategoryChange(v ?? '')}
		>
			<Select.Trigger class="w-full">
				<Tags class="h-4 w-4 mr-2" />
				<Select.Value placeholder="All Categories">{categoryLabel}</Select.Value>
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all" label="All Categories" />
				{#if categories.length > 0}
					<Select.Separator />
				{/if}
				{#each categories as category}
					<Select.Item
						value={String(category.categoryGroupId)}
						label="{category.categoryGroupName} ({category.count})"
					/>
				{/each}
				<Select.Separator />
				<a
					href="{basePath}/category"
					class="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-sm transition-colors"
				>
					<Settings2 class="h-4 w-4" />
					Manage Categories
				</a>
			</Select.Content>
		</Select.Root>
	</div>

	<!-- stock level -->
	<div class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-muted-foreground">Stock Level</span>
		<Select.Root
			type="single"
			value={stockFilter}
			onValueChange={(v) => onStockFilterChange(v ?? '')}
		>
			<Select.Trigger class="w-full">
				<Package class="h-4 w-4 mr-2" />
				<Select.Value placeholder="All Stock Levels">{stockFilterLabel}</Select.Value>
			</Select.Trigger>
			<Select.Content>
				{#each stockFilterOptions as option}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- sort -->
	<div class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-muted-foreground">Sort By</span>
		<Select.Root
			type="single"
			value={sortOption}
			onValueChange={(v) => onSortChange(v ?? 'name-asc')}
		>
			<Select.Trigger class="w-full">
				<ArrowUpDown class="h-4 w-4 mr-2" />
				<Select.Value placeholder="Name (A-Z)">{sortLabel}</Select.Value>
			</Select.Trigger>
			<Select.Content>
				{#each sortOptions as option}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- per page -->
	<div class="flex flex-col gap-1.5">
		<span class="text-sm font-medium text-muted-foreground">Per Page</span>
		<Select.Root
			type="single"
			value={perPage}
			onValueChange={(v) => onPerPageChange(v ?? '20')}
		>
			<Select.Trigger class="w-full">
				<List class="h-4 w-4 mr-2" />
				<Select.Value placeholder="20 per page">{perPageLabel}</Select.Value>
			</Select.Trigger>
			<Select.Content>
				{#each perPageOptions as option}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<!-- reset -->
	{#if hasNonDefaultFilters}
		<button
			onclick={onReset}
			class="text-sm text-muted-foreground hover:text-foreground underline self-start"
		>
			Reset filters
		</button>
	{/if}
</div>
