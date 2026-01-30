<script lang="ts">
	import {
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
	import InventoryTable from '$lib/components/InventoryTable.svelte';
	import StockAlerts from '$lib/components/StockAlerts.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';
	import type { Product } from '$lib/types';
	import { cn } from '$lib/utils';

	import type { PageData } from './$types';
	import { notificationStore } from '../../../stores';

	let { data }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	// Base path for inventory routes
	const basePath = '/inventory';

	// Local state (Svelte 5 runes)
	let viewMode = $state<'grid' | 'list' | 'table'>('table');
	let searchInput = $state(data.filters?.search || '');
	let selectedCategory = $state(data.filters?.categoryId || 'all');
	let stockFilter = $state(data.filters?.stockFilter || 'all');

	// Drawer state
	let drawerOpen = $state(false);
	let selectedProduct = $state<Product | null>(null);

	// Refresh state
	let isRefreshing = $state(false);

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
		const category = overrides.categoryId !== undefined ? overrides.categoryId : selectedCategory;
		const stock = overrides.stockFilter !== undefined ? overrides.stockFilter : stockFilter;
		const pageNum = overrides.page !== undefined ? overrides.page : 1;

		params.set('page', String(pageNum));
		if (search) params.set('productName', String(search));
		if (category && category !== 'all') params.set('categoryId', String(category));
		if (stock && stock !== 'all') params.set('stockFilter', String(stock));

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

	// Handle category filter
	function handleCategoryChange(categoryId: string) {
		selectedCategory = categoryId;
		goto(buildUrl({ categoryId, page: 1 }), { keepFocus: true });
	}

	// Handle stock filter change
	function handleStockFilterChange(value: string) {
		stockFilter = value;
		goto(buildUrl({ stockFilter: value, page: 1 }), { keepFocus: true });
	}

	// Clear functions
	function clearSearch() {
		searchInput = '';
		goto(buildUrl({ search: '' }), { keepFocus: true });
	}

	function clearCategory() {
		selectedCategory = 'all';
		goto(buildUrl({ categoryId: 'all' }), { keepFocus: true });
	}

	function clearStockFilter() {
		stockFilter = 'all';
		goto(buildUrl({ stockFilter: 'all' }), { keepFocus: true });
	}

	function clearAllFilters() {
		searchInput = '';
		selectedCategory = 'all';
		stockFilter = 'all';
		goto(`${basePath}?page=1`);
	}

	// Stock filter options
	const stockFilterOptions = [
		{ value: 'all', label: 'All Stock Levels' },
		{ value: 'in-stock', label: 'In Stock' },
		{ value: 'low-stock', label: 'Low Stock' },
		{ value: 'out-of-stock', label: 'Out of Stock' },
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

	// Update local state when page data changes (for SSR navigation)
	$effect(() => {
		searchInput = data.filters?.search || '';
		selectedCategory = data.filters?.categoryId || 'all';
		stockFilter = data.filters?.stockFilter || 'all';
	});
</script>

<svelte:head>
	<title>Inventory - Busser</title>
</svelte:head>

<!-- Dashboard Header -->
<InventoryDashboard stats={data.stats} />

<!-- Stock Alerts -->
<StockAlerts outOfStockItems={data.outOfStockItems} lowStockItems={data.lowStockItems} />

<!-- Toolbar -->
<div class="flex flex-col sm:flex-row gap-3 mb-6">
	<!-- Search -->
	<form onsubmit={handleSearch} class="flex-1">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search products..."
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

	<div class="flex items-center gap-2 flex-wrap">
		<!-- Category Filter Select -->
		<Select.Root
			type="single"
			value={selectedCategory}
			onValueChange={(v) => handleCategoryChange(v ?? '')}
		>
			<Select.Trigger class="w-[180px]">
				<Tags class="h-4 w-4 mr-2" />
				<Select.Value placeholder="All Categories" />
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="all" label="All Categories" />
				{#if data.categories.length > 0}
					<Select.Separator />
				{/if}
				{#each data.categories as category}
					<Select.Item
						value={String(category.categoryId)}
						label="{category.categoryName} ({category.count})"
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
			<Select.Trigger class="w-[180px]">
				<Package class="h-4 w-4 mr-2" />
				<Select.Value placeholder="All Stock Levels" />
			</Select.Trigger>
			<Select.Content>
				{#each stockFilterOptions as option}
					<Select.Item value={option.value} label={option.label} />
				{/each}
			</Select.Content>
		</Select.Root>

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

		<!-- Add Product Button -->
		{#if canModify}
			<a href="{basePath}/add" class={cn(buttonVariants(), 'shrink-0')}>
				<Plus class="h-4 w-4 sm:mr-2" />
				<span class="hidden sm:inline">Add Product</span>
			</a>
		{/if}
	</div>
</div>

<!-- Active Filters Display -->
<ActiveFiltersDisplay
	search={searchInput}
	categoryId={selectedCategory}
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
	<!-- Table View -->
	<InventoryTable
		products={data.data}
		paginationData={data.pagination}
		recipeUsage={data.recipeUsage}
		onRowClick={handleCardClick}
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

<!-- Detail Drawer -->
<InventoryDetailDrawer
	bind:open={drawerOpen}
	product={selectedProduct}
	recipeCount={selectedProduct?.productId ? data.recipeUsage[selectedProduct.productId] || 0 : 0}
	onStockChange={handleStockChange}
/>
