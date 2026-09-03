<script lang="ts">
	import { ArrowUpDown, List, Package, Settings2, Store, Tags } from 'lucide-svelte';

	import * as Select from '$lib/components/ui/select';
	import type { CategoryGroupCount, Supplier } from '$lib/types';

	let {
		categories,
		suppliers = [],
		selectedCategory,
		selectedSupplier,
		stockFilter,
		sortOption,
		perPage,
		showStock = true,
		basePath = '/inventory',
		onCategoryChange,
		onSupplierChange,
		onStockFilterChange,
		onSortChange,
		onPerPageChange,
		onReset,
	}: {
		categories: CategoryGroupCount[];
		suppliers?: Supplier[];
		selectedCategory: string;
		selectedSupplier: string;
		stockFilter: string;
		sortOption: string;
		perPage: string;
		showStock?: boolean;
		basePath?: string;
		onCategoryChange: (value: string) => void;
		onSupplierChange: (value: string) => void;
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
		{ value: '12', label: '12 per page' },
		{ value: '24', label: '24 per page' },
		{ value: '48', label: '48 per page' },
		{ value: '96', label: '96 per page' },
	];

	const categoryLabel = $derived.by(() => {
		if (!selectedCategory || selectedCategory === 'all') return 'All Categories';
		const cat = categories.find((c) => String(c.categoryGroupId) === selectedCategory);
		return cat ? `${cat.categoryGroupName} (${cat.count})` : 'All Categories';
	});

	const supplierLabel = $derived.by(() => {
		if (!selectedSupplier || selectedSupplier === 'all') return 'All Suppliers';
		const sup = suppliers.find((s) => String(s.supplierId) === selectedSupplier);
		return sup?.supplierName || 'All Suppliers';
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
		return option?.label || '24 per page';
	});

	const hasNonDefaultFilters = $derived(
		(selectedCategory && selectedCategory !== 'all') ||
			(selectedSupplier && selectedSupplier !== 'all') ||
			(stockFilter && stockFilter !== 'all') ||
			sortOption !== 'name-asc' ||
			perPage !== '24'
	);
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 sm:grid-flow-row-dense gap-4">
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

	<!-- supplier -->
	{#if suppliers.length > 0}
		<div class="flex flex-col gap-1.5">
			<span class="text-sm font-medium text-muted-foreground">Supplier</span>
			<Select.Root
				type="single"
				value={selectedSupplier}
				onValueChange={(v) => onSupplierChange(v ?? '')}
			>
				<Select.Trigger class="w-full">
					<Store class="h-4 w-4 mr-2" />
					<Select.Value placeholder="All Suppliers">{supplierLabel}</Select.Value>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="All Suppliers" />
					<Select.Separator />
					{#each suppliers as supplier}
						<Select.Item
							value={String(supplier.supplierId)}
							label={supplier.supplierName || 'Unknown'}
						/>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	{/if}

	<!-- stock level -->
	{#if showStock}
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
	{/if}

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
		<Select.Root type="single" value={perPage} onValueChange={(v) => onPerPageChange(v ?? '24')}>
			<Select.Trigger class="w-full">
				<List class="h-4 w-4 mr-2" />
				<Select.Value placeholder="24 per page">{perPageLabel}</Select.Value>
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
			class="focus-ring text-sm text-muted-foreground hover:text-foreground underline justify-self-start sm:col-span-2"
		>
			Reset filters
		</button>
	{/if}
</div>
