<script lang="ts">
	import {
		ArrowUpDown,
		ChevronLeft,
		ChevronRight,
		LayoutGrid,
		List,
		Package,
		Plus,
		RefreshCw,
		Search,
		Settings2,
		TableIcon,
		Tags,
		Trash2,
		PackageCheck,
		PackageX,
		X,
	} from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import ActiveFiltersDisplay from '$lib/components/ActiveFiltersDisplay.svelte';
	import InventoryCard from '$lib/components/InventoryCard.svelte';
	import InventoryDashboard from '$lib/components/InventoryDashboard.svelte';
	import InventoryDetailDrawer from '$lib/components/InventoryDetailDrawer.svelte';
	import InventoryNav from '$lib/components/InventoryNav.svelte';
	import InventoryTable from '$lib/components/InventoryTable.svelte';
	import StockAlerts from '$lib/components/StockAlerts.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import type { Product } from '$lib/types';
	import { cn } from '$lib/utils';

	import type { PageData } from './$types';
	import { notificationStore } from '../../../stores';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';

	let { data }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	// Base path for inventory routes
	const basePath = '/inventory';

	// Local state (Svelte 5 runes)
	let viewMode = $state<'grid' | 'list' | 'table'>('table');
	let searchInput = $state(data.filters?.search || '');
	let selectedCategory = $state(data.filters?.categoryGroupId || 'all');
	let stockFilter = $state(data.filters?.stockFilter || 'all');
	let sortOption = $state(data.filters?.sort || 'name-asc');
	let perPage = $state(String(data.filters?.perPage || 20));

	// Drawer state
	let drawerOpen = $state(false);
	let selectedProduct = $state<Product | null>(null);

	// Refresh state
	let isRefreshing = $state(false);

	// Bulk selection state (use array instead of Set for Svelte 5 reactivity)
	let selectedIds = $state<number[]>([]);
	let deleteDialogOpen = $state(false);
	let bulkActionLoading = $state(false);

	function handleSelectionChange(ids: number[]) {
		selectedIds = ids;
	}

	function clearSelection() {
		selectedIds = [];
	}

	async function handleBulkSetStock(inStock: boolean) {
		if (selectedIds.length === 0) return;
		bulkActionLoading = true;
		try {
			const res = await fetch('/api/inventory/bulk/stock', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productIds: selectedIds, inStock }),
			});
			if (!res.ok) {
				const err = await res.json();
				$notificationStore.error = { message: err?.message || 'Failed to update stock.' };
				return;
			}
			const result = await res.json();
			const label = inStock ? 'in stock' : 'out of stock';
			clearSelection();
			$notificationStore.success = { message: `Marked ${result.updated} item(s) as ${label}.` };
			await invalidateAll();
		} catch {
			$notificationStore.error = { message: 'Failed to update stock.' };
		} finally {
			bulkActionLoading = false;
		}
	}

	async function handleBulkDelete() {
		if (selectedIds.length === 0) return;
		bulkActionLoading = true;
		try {
			const res = await fetch('/api/inventory/bulk', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productIds: selectedIds }),
			});
			if (!res.ok) {
				const err = await res.json();
				$notificationStore.error = { message: err?.message || 'Failed to delete items.' };
				return;
			}
			const result = await res.json();
			deleteDialogOpen = false;
			clearSelection();
			$notificationStore.success = { message: `Deleted ${result.succeeded} item(s).` };
			await invalidateAll();
		} catch {
			$notificationStore.error = { message: 'Failed to delete items.' };
		} finally {
			bulkActionLoading = false;
		}
	}

	// Handle refresh
	async function handleRefresh() {
		isRefreshing = true;
		await invalidateAll();
		isRefreshing = false;
	}

	// Handle card click to open drawer
	function handleCardClick(product: Product) {
		selectedProduct = product;
		drawerOpen = true;
	}

	// Handle stock change from drawer
	async function handleStockChange(productId: number, inStock: boolean) {
		// Optimistically update local data
		const productIndex = data.data.findIndex((p) => p.productId === productId);
		if (productIndex !== -1) {
			data.data[productIndex].productInStockQuantity = inStock ? 1 : 0;
		}
		if (selectedProduct?.productId === productId) {
			selectedProduct = { ...selectedProduct, productInStockQuantity: inStock ? 1 : 0 };
		}

		// Send update to server
		try {
			await fetch(`/api/inventory/${productId}/stock`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ inStock }),
			});
			drawerOpen = false;
			$notificationStore.success = { message: 'Inventory updated.' };
			await invalidateAll();
		} catch (error) {
			console.error('Failed to update stock:', error);
			$notificationStore.error = { message: 'Failed to update inventory.' };

			// Revert on error
			if (productIndex !== -1) {
				data.data[productIndex].productInStockQuantity = inStock ? 0 : 1;
			}
		}
	}

	// Restore view mode from localStorage
	onMount(() => {
		const savedViewMode = localStorage.getItem('inventory-view-mode');
		if (savedViewMode === 'list' || savedViewMode === 'grid' || savedViewMode === 'table') {
			viewMode = savedViewMode;
		}
	});

	// Save view mode preference
	function setViewMode(mode: 'grid' | 'list' | 'table') {
		viewMode = mode;
		if (browser) {
			localStorage.setItem('inventory-view-mode', mode);
		}
	}

	// Build URL with current filters
	function buildUrl(overrides: Record<string, string | number | null> = {}) {
		const params = new URLSearchParams();

		const search = overrides.search !== undefined ? overrides.search : searchInput;
		const category =
			overrides.categoryGroupId !== undefined ? overrides.categoryGroupId : selectedCategory;
		const stock = overrides.stockFilter !== undefined ? overrides.stockFilter : stockFilter;
		const sort = overrides.sort !== undefined ? overrides.sort : sortOption;
		const pageNum = overrides.page !== undefined ? overrides.page : 1;
		const pp = overrides.perPage !== undefined ? overrides.perPage : perPage;

		params.set('page', String(pageNum));
		if (search) params.set('productName', String(search));
		if (category && category !== 'all') params.set('categoryGroupId', String(category));
		if (stock && stock !== 'all') params.set('stockFilter', String(stock));
		if (sort && sort !== 'name-asc') params.set('sort', String(sort));
		if (pp && String(pp) !== '20') params.set('perPage', String(pp));

		return `${basePath}?${params.toString()}`;
	}

	// Apply filters (navigate with new params)
	function applyFilters() {
		goto(buildUrl(), { keepFocus: true });
	}

	// Handle search submit
	function handleSearch(e: Event) {
		e.preventDefault();
		applyFilters();
	}

	// Handle category group filter
	function handleCategoryChange(categoryGroupId: string) {
		selectedCategory = categoryGroupId;
		goto(buildUrl({ categoryGroupId, page: 1 }), { keepFocus: true });
	}

	// Handle stock filter change
	function handleStockFilterChange(value: string) {
		stockFilter = value;
		goto(buildUrl({ stockFilter: value, page: 1 }), { keepFocus: true });
	}

	// Handle sort change
	function handleSortChange(value: string) {
		sortOption = value;
		goto(buildUrl({ sort: value, page: 1 }), { keepFocus: true });
	}

	// Handle per-page change
	function handlePerPageChange(value: string) {
		perPage = value;
		goto(buildUrl({ perPage: value, page: 1 }), { keepFocus: true });
	}

	// Clear functions
	function clearSearch() {
		searchInput = '';
		goto(buildUrl({ search: '' }), { keepFocus: true });
	}

	function clearCategory() {
		selectedCategory = 'all';
		goto(buildUrl({ categoryGroupId: 'all' }), { keepFocus: true });
	}

	function clearStockFilter() {
		stockFilter = 'all';
		goto(buildUrl({ stockFilter: 'all' }), { keepFocus: true });
	}

	function clearAllFilters() {
		searchInput = '';
		selectedCategory = 'all';
		stockFilter = 'all';
		sortOption = 'name-asc';
		goto(`${basePath}?page=1`);
	}

	// Stock filter options
	const stockFilterOptions = [
		{ value: 'all', label: 'All Stock Levels' },
		{ value: 'in-stock', label: 'In Stock' },
		{ value: 'out-of-stock', label: 'Out of Stock' },
	];

	// Sort options
	const sortOptions = [
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
	];

	// Per-page options
	const perPageOptions = [
		{ value: '20', label: '20 per page' },
		{ value: '50', label: '50 per page' },
		{ value: '100', label: '100 per page' },
	];

	// Pagination navigation
	function navigatePage(pageNum: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(pageNum));
		goto(`${basePath}?${params.toString()}`);
	}

	// Generate page links
	const pages = $derived.by(() => {
		const { total, perPage, currentPage } = data.pagination;
		const totalPages = Math.ceil(total / perPage);
		return Array.from({ length: totalPages }, (_, i) => ({
			number: i + 1,
			active: i + 1 === currentPage,
		}));
	});

	// Check if any filters are active
	const hasActiveFilters = $derived(
		!!searchInput ||
			(selectedCategory && selectedCategory !== 'all') ||
			(stockFilter && stockFilter !== 'all')
	);

	// Compute display labels for select dropdowns
	const categoryLabel = $derived.by(() => {
		if (!selectedCategory || selectedCategory === 'all') return 'All Categories';
		const cat = data.categories.find((c) => String(c.categoryGroupId) === selectedCategory);
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

	// Update local state when page data changes (for SSR navigation)
	$effect(() => {
		searchInput = data.filters?.search || '';
		selectedCategory = data.filters?.categoryGroupId || 'all';
		stockFilter = data.filters?.stockFilter || 'all';
		sortOption = data.filters?.sort || 'name-asc';
		perPage = String(data.filters?.perPage || 20);
	});
</script>

<svelte:head>
	<title>Inventory - Busser</title>
</svelte:head>

<!-- Inventory Section Navigation -->
<InventoryNav />

<!-- Dashboard Header -->
<InventoryDashboard stats={data.stats} />

<!-- Stock Alerts -->
<StockAlerts outOfStockItems={data.outOfStockItems} />

<!-- Toolbar -->
<div class="flex flex-col gap-3 mb-6">
	<!-- Row 1: Search, Categories, Stock Filter (+ action buttons on large screens) -->
	<div class="flex flex-col lg:flex-row gap-3 lg:items-center">
		<!-- Search (full width on mobile/tablet, flex-1 on desktop) -->
		<form onsubmit={handleSearch} class="lg:flex-1">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search inventory..."
					bind:value={searchInput}
					class="pl-10 pr-10"
				/>
				{#if searchInput}
					<button
						type="button"
						onclick={clearSearch}
						class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
					>
						<X class="h-4 w-4" />
					</button>
				{/if}
			</div>
		</form>

		<!-- Filters (stacked on mobile, row on sm+) -->
		<div class="flex flex-col sm:flex-row gap-3">
			<!-- Category Group Filter Select -->
			<Select.Root
				type="single"
				value={selectedCategory}
				onValueChange={(v) => handleCategoryChange(v ?? '')}
			>
				<Select.Trigger class="w-full sm:w-[180px]">
					<Tags class="h-4 w-4 mr-2" />
					<Select.Value placeholder="All Categories">{categoryLabel}</Select.Value>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="All Categories" />
					{#if data.categories.length > 0}
						<Select.Separator />
					{/if}
					{#each data.categories as category}
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

			<!-- Stock Filter Select -->
			<Select.Root
				type="single"
				value={stockFilter}
				onValueChange={(v) => handleStockFilterChange(v ?? '')}
			>
				<Select.Trigger class="w-full sm:w-[180px]">
					<Package class="h-4 w-4 mr-2" />
					<Select.Value placeholder="All Stock Levels">{stockFilterLabel}</Select.Value>
				</Select.Trigger>
				<Select.Content>
					{#each stockFilterOptions as option}
						<Select.Item value={option.value} label={option.label} />
					{/each}
				</Select.Content>
			</Select.Root>

			<!-- Sort Select -->
			<Select.Root
				type="single"
				value={sortOption}
				onValueChange={(v) => handleSortChange(v ?? 'name-asc')}
			>
				<Select.Trigger class="w-full sm:w-[180px]">
					<ArrowUpDown class="h-4 w-4 mr-2" />
					<Select.Value placeholder="Name (A-Z)">{sortLabel}</Select.Value>
				</Select.Trigger>
				<Select.Content>
					{#each sortOptions as option}
						<Select.Item value={option.value} label={option.label} />
					{/each}
				</Select.Content>
			</Select.Root>

			<!-- Per Page Select -->
			<Select.Root
				type="single"
				value={perPage}
				onValueChange={(v) => handlePerPageChange(v ?? '20')}
			>
				<Select.Trigger class="w-full sm:w-[150px]">
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

		<!-- Action buttons (large screens only - inline with filters) -->
		<div class="hidden lg:flex items-center gap-2">
			<!-- View Toggle -->
			<div class="flex items-center border border-input/50 rounded-lg overflow-hidden">
				<button
					class={cn(
						'h-10 w-10 flex items-center justify-center transition-colors',
						viewMode === 'table' ? 'bg-accent text-primary-foreground' : 'hover:bg-muted'
					)}
					onclick={() => setViewMode('table')}
					aria-label="Table view"
				>
					<TableIcon class="h-4 w-4" />
				</button>
				<button
					class={cn(
						'h-10 w-10 flex items-center justify-center transition-colors',
						viewMode === 'grid' ? 'bg-accent text-primary-foreground' : 'hover:bg-muted'
					)}
					onclick={() => setViewMode('grid')}
					aria-label="Grid view"
				>
					<LayoutGrid class="h-4 w-4" />
				</button>
				<button
					class={cn(
						'h-10 w-10 flex items-center justify-center transition-colors',
						viewMode === 'list' ? 'bg-accent text-primary-foreground' : 'hover:bg-muted'
					)}
					onclick={() => setViewMode('list')}
					aria-label="List view"
				>
					<List class="h-4 w-4" />
				</button>
			</div>

			<!-- Refresh Button -->
			<Button
				variant="outline"
				size="icon"
				onclick={handleRefresh}
				disabled={isRefreshing}
				aria-label="Refresh inventory"
			>
				<RefreshCw class={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
			</Button>

			<!-- Add Product Button -->
			{#if canModify}
				<a href="{basePath}/add" class={cn(buttonVariants(), 'shrink-0')}>
					<Plus class="h-4 w-4 mr-2" />
					<span>Add Product</span>
				</a>
			{/if}
		</div>
	</div>

	<!-- Row 2: Action buttons (small/medium screens only) -->
	<div class="flex items-center gap-2 lg:hidden">
		<!-- View Toggle -->
		<div class="flex items-center border border-input/50 rounded-lg overflow-hidden">
			<button
				class={cn(
					'h-10 w-10 flex items-center justify-center transition-colors',
					viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
				)}
				onclick={() => setViewMode('table')}
				aria-label="Table view"
			>
				<TableIcon class="h-4 w-4" />
			</button>
			<button
				class={cn(
					'h-10 w-10 flex items-center justify-center transition-colors',
					viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
				)}
				onclick={() => setViewMode('grid')}
				aria-label="Grid view"
			>
				<LayoutGrid class="h-4 w-4" />
			</button>
			<button
				class={cn(
					'h-10 w-10 flex items-center justify-center transition-colors',
					viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
				)}
				onclick={() => setViewMode('list')}
				aria-label="List view"
			>
				<List class="h-4 w-4" />
			</button>
		</div>

		<!-- Refresh Button -->
		<Button
			variant="outline"
			size="icon"
			onclick={handleRefresh}
			disabled={isRefreshing}
			aria-label="Refresh inventory"
		>
			<RefreshCw class={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
		</Button>

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- Add Product Button -->
		{#if canModify}
			<a href="{basePath}/add" class={cn(buttonVariants({ variant: 'default' }), 'shrink-0')}>
				<Plus class="h-4 w-4 mr-2" />
				<span>Add Product</span>
			</a>
		{/if}
	</div>
</div>

<!-- Active Filters Display -->
<ActiveFiltersDisplay
	search={searchInput}
	categoryGroupId={selectedCategory}
	{stockFilter}
	categories={data.categories}
	onClearSearch={clearSearch}
	onClearCategory={clearCategory}
	onClearStockFilter={clearStockFilter}
	onClearAll={clearAllFilters}
/>

<!-- Results Count -->
<div class="flex items-center justify-between mb-4">
	<p class="text-sm text-muted-foreground">
		Showing {data.data.length} of {data.pagination.total} products
	</p>
</div>

<!-- Content Area -->
{#if data.data.length === 0}
	<!-- Empty State -->
	<Card.Root class="border-dashed">
		<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
			<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
				<Package class="h-10 w-10 text-muted-foreground/50" />
			</div>
			<h3 class="text-xl font-semibold mb-2">No Products Found</h3>
			<p class="text-muted-foreground mb-6 max-w-md">
				{#if hasActiveFilters}
					No products match your current filters. Try adjusting your search or clearing filters.
				{:else}
					Your inventory is empty. Start by adding your first product!
				{/if}
			</p>
			<div class="flex gap-3">
				{#if hasActiveFilters}
					<Button variant="outline" onclick={clearAllFilters}>Clear Filters</Button>
				{/if}
				{#if canModify}
					<a href="{basePath}/add" class={buttonVariants()}>
						<Plus class="h-4 w-4 mr-2" />
						Add Product
					</a>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
{:else if viewMode === 'table'}
	<!-- Bulk Action Bar -->
	{#if canModify && selectedIds.length > 0}
		<div
			class="sticky top-0 z-10 mb-4 rounded-lg border border-border/50 bg-background/80 backdrop-blur-md px-4 py-3 shadow-sm"
		>
			<div class="flex items-center justify-between mb-2 sm:mb-0">
				<span class="text-sm font-medium">{selectedIds.length} selected</span>
				<Button variant="ghost" size="sm" onclick={clearSelection}>
					<X class="h-4 w-4 mr-1.5" />
					Clear
				</Button>
			</div>
			<div class="flex items-center gap-2 sm:mt-0">
				<Button
					variant="outline"
					size="sm"
					class="flex-1 sm:flex-none"
					onclick={() => handleBulkSetStock(true)}
					disabled={bulkActionLoading}
				>
					<PackageCheck class="h-4 w-4 sm:mr-1.5" />
					<span class="hidden sm:inline">Mark</span> In Stock
				</Button>
				<Button
					variant="outline"
					size="sm"
					class="flex-1 sm:flex-none"
					onclick={() => handleBulkSetStock(false)}
					disabled={bulkActionLoading}
				>
					<PackageX class="h-4 w-4 sm:mr-1.5" />
					<span class="hidden sm:inline">Mark</span> Out of Stock
				</Button>
				<Button
					variant="destructive"
					size="sm"
					class="flex-1 sm:flex-none"
					onclick={() => (deleteDialogOpen = true)}
					disabled={bulkActionLoading}
				>
					<Trash2 class="h-4 w-4 sm:mr-1.5" />
					Delete
				</Button>
			</div>
		</div>
	{/if}

	<!-- Table View -->
	<InventoryTable
		products={data.data}
		paginationData={data.pagination}
		recipeUsage={data.recipeUsage}
		onRowClick={handleCardClick}
		selectable={canModify}
		{selectedIds}
		onSelectionChange={handleSelectionChange}
	/>
{:else}
	<!-- Grid/List View -->
	<div
		class={cn(
			viewMode === 'grid'
				? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
				: 'flex flex-col gap-3'
		)}
	>
		{#each data.data as product (product.productId)}
			<InventoryCard
				{product}
				{viewMode}
				recipeCount={product.productId ? data.recipeUsage[product.productId] || 0 : 0}
				onClick={handleCardClick}
			/>
		{/each}
	</div>

	<!-- Pagination for Grid/List views -->
	{#if data.data.length > 0}
		<div class="flex flex-col items-center justify-center gap-2 p-7">
			<div class="text-sm text-gray-700 dark:text-gray-400">
				Page <span class="font-semibold text-gray-900 dark:text-white">
					{data.pagination.currentPage}
				</span>
				of
				<span class="font-semibold text-gray-900 dark:text-white">
					{Math.ceil(data.pagination.total / data.pagination.perPage)}
				</span>
				out of
				<span class="font-semibold text-gray-900 dark:text-white">
					{data.pagination.total}
				</span>
				items
			</div>
			<nav class="flex items-center gap-1">
				<Button
					variant="outline"
					size="icon"
					onclick={() => navigatePage(data.pagination.prevPage || data.pagination.currentPage)}
					disabled={!data.pagination.prevPage}
				>
					<span class="sr-only">Previous</span>
					<ChevronLeft class="w-5 h-5" />
				</Button>
				{#each pages as p}
					<Button
						variant={p.active ? 'default' : 'outline'}
						size="sm"
						onclick={() => navigatePage(p.number)}
					>
						{p.number}
					</Button>
				{/each}
				<Button
					variant="outline"
					size="icon"
					onclick={() => navigatePage(data.pagination.nextPage || data.pagination.currentPage)}
					disabled={!data.pagination.nextPage}
				>
					<span class="sr-only">Next</span>
					<ChevronRight class="w-5 h-5" />
				</Button>
			</nav>
		</div>
	{/if}
{/if}

<!-- Recently Added Section -->
{#if data.recentlyAdded.length > 0 && !hasActiveFilters}
	<div class="mt-12">
		<h2 class="text-2xl font-bold mb-4">Recently Added</h2>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
			{#each data.recentlyAdded as product (product.productId)}
				<InventoryCard
					{product}
					viewMode="grid"
					recipeCount={product.productId ? data.recipeUsage[product.productId] || 0 : 0}
					onClick={handleCardClick}
				/>
			{/each}
		</div>
	</div>
{/if}

<!-- Bulk Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete {selectedIds.length} item(s)?</Dialog.Title>
			<Dialog.Description>
				This will permanently remove the selected products from your inventory. This action cannot
				be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => (deleteDialogOpen = false)}
				disabled={bulkActionLoading}
			>
				Cancel
			</Button>
			<Button variant="destructive" onclick={handleBulkDelete} disabled={bulkActionLoading}>
				{#if bulkActionLoading}
					Deleting...
				{:else}
					Delete
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<!-- Detail Drawer -->
<InventoryDetailDrawer
	bind:open={drawerOpen}
	product={selectedProduct}
	recipeCount={selectedProduct?.productId ? data.recipeUsage[selectedProduct.productId] || 0 : 0}
	onStockChange={handleStockChange}
/>
