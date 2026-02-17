<script lang="ts">
	import { Package, PackageCheck, PackageX, Plus, Search, Trash2, X } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import ActiveFiltersDisplay from '$lib/components/ActiveFiltersDisplay.svelte';
	import FilterButton from '$lib/components/FilterButton.svelte';
	import InventoryCard from '$lib/components/InventoryCard.svelte';
	import InventoryDashboard from '$lib/components/InventoryDashboard.svelte';
	import InventoryDetailDrawer from '$lib/components/InventoryDetailDrawer.svelte';
	import InventoryFilterPanel from '$lib/components/InventoryFilterPanel.svelte';
	import InventoryNav from '$lib/components/InventoryNav.svelte';
	import InventoryTable from '$lib/components/InventoryTable.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import StockAlerts from '$lib/components/StockAlerts.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
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

	// Filter panel state
	let filterOpen = $state(false);

	// count of non-default filters behind the filter panel
	const activeFilterCount = $derived.by(() => {
		let count = 0;
		if (selectedCategory && selectedCategory !== 'all') count++;
		if (stockFilter && stockFilter !== 'all') count++;
		if (sortOption !== 'name-asc') count++;
		if (perPage !== '20') count++;
		return count;
	});

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
		await invalidateAll();
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

	// reset filters behind the panel (category, stock, sort, perPage)
	function resetPanelFilters() {
		selectedCategory = 'all';
		stockFilter = 'all';
		sortOption = 'name-asc';
		perPage = '20';
		goto(buildUrl({ categoryGroupId: 'all', stockFilter: 'all', sort: 'name-asc', perPage: '20', page: 1 }));
	}

	// Pagination navigation
	function navigatePage(pageNum: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(pageNum));
		goto(`${basePath}?${params.toString()}`);
	}

	// Check if any filters are active
	const hasActiveFilters = $derived(
		!!searchInput ||
			(selectedCategory && selectedCategory !== 'all') ||
			(stockFilter && stockFilter !== 'all')
	);

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
	<div class="flex items-center gap-2">
		<!-- Search -->
		<form onsubmit={handleSearch} class="flex-1 min-w-0">
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

		<!-- Filters -->
		<FilterButton bind:open={filterOpen} activeCount={activeFilterCount} viewModes={['table', 'grid', 'list']} activeView={viewMode} onViewChange={setViewMode} onRefresh={handleRefresh}>
			<InventoryFilterPanel
				categories={data.categories}
				{selectedCategory}
				{stockFilter}
				{sortOption}
				{perPage}
				{basePath}
				onCategoryChange={handleCategoryChange}
				onStockFilterChange={handleStockFilterChange}
				onSortChange={handleSortChange}
				onPerPageChange={handlePerPageChange}
				onReset={resetPanelFilters}
			/>
		</FilterButton>

		<!-- View toggle -->
		<ViewToggle modes={['table', 'grid', 'list']} active={viewMode} onchange={setViewMode} />

		<!-- Add Product -->
		{#if canModify}
			<a href="{basePath}/add" class={cn(buttonVariants(), 'shrink-0 w-10 px-0 sm:w-auto sm:px-4')}>
				<Plus class="h-4 w-4 sm:mr-2" />
				<span class="hidden sm:inline">Add Product</span>
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
		<Pagination
			pagination={data.pagination}
			itemLabel="products"
			onNavigate={navigatePage}
		/>
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
