<script lang="ts">
	import {
		Flame,
		FlaskConical,
		PackageCheck,
		Search,
		ShoppingCart,
		X,
	} from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { haptics } from '$lib/utils/haptics';
	import FilterButton from '$lib/components/FilterButton.svelte';
	import InventoryNav from '$lib/components/InventoryNav.svelte';
	import NearbyStoreSearch from '$lib/components/NearbyStoreSearch.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ShoppingListHeader from '$lib/components/ShoppingListHeader.svelte';
	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import SupplierCard from '$lib/components/SupplierCard.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Indicator } from '$lib/components/ui/indicator';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import type { PlaceResult, ShoppingListItem } from '$lib/types';
	import { cn } from '$lib/utils';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';

	import type { PageData } from './$types';
	import { notificationStore } from '../../../../stores';

	let { data }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	const basePath = '/inventory/suppliers';

	// local filter state
	let viewMode = $state<'grid' | 'list' | 'table'>('table');
	let searchInput = $state(data.filters?.search || '');
	let selectedCategory = $state(data.filters?.categoryGroupId || 'all');
	let selectedSupplier = $state(data.filters?.supplierId || 'all');
	let sortOption = $state(data.filters?.sort || 'name-asc');
	let perPage = $state(String(data.filters?.perPage || 20));

	// filter panel state
	let filterOpen = $state(false);

	const activeFilterCount = $derived.by(() => {
		let count = 0;
		if (selectedCategory && selectedCategory !== 'all') count++;
		if (selectedSupplier && selectedSupplier !== 'all') count++;
		if (sortOption !== 'name-asc') count++;
		if (perPage !== '20') count++;
		return count;
	});

	// multi-select state
	let selectedIds = $state<number[]>([]);
	let bulkActionLoading = $state(false);

	function handleSelectionChange(ids: number[]) {
		selectedIds = ids;
	}

	function clearSelection() {
		selectedIds = [];
	}

	// optimistic restock tracking
	let restockingIds = $state(new Set<number>());

	// saved suppliers (excluding default "Any")
	const savedSuppliers = $derived(data.suppliers);

	// supplier product counts
	const supplierProductCounts = $derived.by(() => {
		const counts = new Map<number, number>();
		for (const item of data.items) {
			counts.set(item.supplierId, (counts.get(item.supplierId) || 0) + 1);
		}
		return counts;
	});

	// impact level helper
	function getImpactLevel(item: ShoppingListItem): number {
		return item.unlockableRecipes >= 3 ? 3 : item.unlockableRecipes >= 1 ? item.unlockableRecipes : 0;
	}

	// url building
	function buildUrl(overrides: Record<string, string | number | null> = {}) {
		const params = new URLSearchParams();

		const search = overrides.search !== undefined ? overrides.search : searchInput;
		const category = overrides.categoryGroupId !== undefined ? overrides.categoryGroupId : selectedCategory;
		const supplier = overrides.supplierId !== undefined ? overrides.supplierId : selectedSupplier;
		const sort = overrides.sort !== undefined ? overrides.sort : sortOption;
		const pageNum = overrides.page !== undefined ? overrides.page : 1;
		const pp = overrides.perPage !== undefined ? overrides.perPage : perPage;

		params.set('page', String(pageNum));
		if (search) params.set('productName', String(search));
		if (category && category !== 'all') params.set('categoryGroupId', String(category));
		if (supplier && supplier !== 'all') params.set('supplierId', String(supplier));
		if (sort && sort !== 'name-asc') params.set('sort', String(sort));
		if (pp && String(pp) !== '20') params.set('perPage', String(pp));

		return `${basePath}?${params.toString()}`;
	}

	function applyFilters() {
		goto(buildUrl(), { keepFocus: true });
	}

	function handleSearch(e: Event) {
		e.preventDefault();
		applyFilters();
	}

	function handleCategoryChange(value: string) {
		selectedCategory = value;
		goto(buildUrl({ categoryGroupId: value, page: 1 }), { keepFocus: true });
	}

	function handleSupplierChange(value: string) {
		selectedSupplier = value;
		goto(buildUrl({ supplierId: value, page: 1 }), { keepFocus: true });
	}

	function handleSortChange(value: string) {
		sortOption = value;
		goto(buildUrl({ sort: value, page: 1 }), { keepFocus: true });
	}

	function handlePerPageChange(value: string) {
		perPage = value;
		goto(buildUrl({ perPage: value, page: 1 }), { keepFocus: true });
	}

	function clearSearch() {
		searchInput = '';
		goto(buildUrl({ search: '' }), { keepFocus: true });
	}

	function clearAllFilters() {
		searchInput = '';
		selectedCategory = 'all';
		selectedSupplier = 'all';
		sortOption = 'name-asc';
		perPage = '20';
		goto(`${basePath}?page=1`);
	}

	function resetPanelFilters() {
		selectedCategory = 'all';
		selectedSupplier = 'all';
		sortOption = 'name-asc';
		perPage = '20';
		goto(
			buildUrl({
				categoryGroupId: 'all',
				supplierId: 'all',
				sort: 'name-asc',
				perPage: '20',
				page: 1,
			})
		);
	}

	function navigatePage(pageNum: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(pageNum));
		goto(`${basePath}?${params.toString()}`);
	}

	const hasActiveFilters = $derived(
		!!searchInput ||
			(selectedCategory && selectedCategory !== 'all') ||
			(selectedSupplier && selectedSupplier !== 'all')
	);

	// bulk restock selected items (keep in list, don't invalidate)
	async function handleBulkRestock() {
		if (selectedIds.length === 0) return;
		haptics.medium();
		bulkActionLoading = true;
		try {
			const res = await fetch('/api/inventory/bulk/stock', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ productIds: selectedIds, inStock: true }),
			});
			if (!res.ok) {
				const err = await res.json();
				$notificationStore.error = { message: err?.message || 'Failed to update stock.' };
				return;
			}
			const result = await res.json();
			clearSelection();
			$notificationStore.success = { message: `Restocked ${result.updated} item(s).` };
			await invalidateAll();
		} catch {
			$notificationStore.error = { message: 'Failed to update stock.' };
		} finally {
			bulkActionLoading = false;
		}
	}

	// single item restock
	async function handleToggle(productId: number) {
		haptics.medium();
		restockingIds.add(productId);
		restockingIds = new Set(restockingIds);

		try {
			await fetch(`/api/inventory/${productId}/stock`, { method: 'PATCH' });
			await invalidateAll();
		} catch {
			$notificationStore.error = { message: 'Failed to update stock.' };
		} finally {
			restockingIds.delete(productId);
			restockingIds = new Set(restockingIds);
		}
	}

	// table selection helpers
	function toggleSelection(productId: number) {
		const idx = selectedIds.indexOf(productId);
		const next = idx >= 0 ? selectedIds.filter((id) => id !== productId) : [...selectedIds, productId];
		selectedIds = next;
	}

	function toggleAll(checked: boolean) {
		selectedIds = checked ? data.items.map((i) => i.productId) : [];
	}

	const allSelected = $derived(
		data.items.length > 0 && data.items.every((i) => selectedIds.includes(i.productId))
	);

	// suppliers
	async function handleAddSupplier(place: PlaceResult) {
		try {
			const res = await fetch('/api/suppliers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: place.name,
					address: place.address,
					phone: place.phone,
					website: place.website,
					placeId: place.placeId,
					type: 'liquor_store',
				}),
			});
			if (!res.ok) throw new Error('Failed to save supplier');
			$notificationStore.success = { message: `Added ${place.name} to your suppliers.` };
			await invalidateAll();
		} catch {
			$notificationStore.error = { message: 'Failed to add supplier.' };
		}
	}

	async function handleRemoveSupplier(supplierId: number) {
		try {
			const res = await fetch(`/api/suppliers?id=${supplierId}`, { method: 'DELETE' });
			if (!res.ok) throw new Error('Failed to remove supplier');
			$notificationStore.success = { message: 'Supplier removed.' };
			await invalidateAll();
		} catch {
			$notificationStore.error = { message: 'Failed to remove supplier.' };
		}
	}

	async function handleRefresh() {
		await invalidateAll();
	}

	// view mode persistence
	onMount(() => {
		const saved = localStorage.getItem('shopping-list-view-mode');
		if (saved === 'list' || saved === 'grid' || saved === 'table') viewMode = saved;
	});

	function setViewMode(mode: 'grid' | 'list' | 'table') {
		viewMode = mode;
		if (browser) localStorage.setItem('shopping-list-view-mode', mode);
	}

	// sync filters from server data
	$effect(() => {
		searchInput = data.filters?.search || '';
		selectedCategory = data.filters?.categoryGroupId || 'all';
		selectedSupplier = data.filters?.supplierId || 'all';
		sortOption = data.filters?.sort || 'name-asc';
		perPage = String(data.filters?.perPage || 20);
	});

	// filter panel label helpers
	const sortOptions = [
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'price-asc', label: 'Price (Low-High)' },
		{ value: 'price-desc', label: 'Price (High-Low)' },
	];

	const perPageOptions = [
		{ value: '20', label: '20 per page' },
		{ value: '50', label: '50 per page' },
		{ value: '100', label: '100 per page' },
	];

	const categoryLabel = $derived.by(() => {
		if (!selectedCategory || selectedCategory === 'all') return 'All Categories';
		const cat = data.categories.find((c) => String(c.categoryGroupId) === selectedCategory);
		return cat ? `${cat.categoryGroupName} (${cat.count})` : 'All Categories';
	});

	const supplierLabel = $derived.by(() => {
		if (!selectedSupplier || selectedSupplier === 'all') return 'All Suppliers';
		const sup = data.suppliers.find((s) => String(s.supplierId) === selectedSupplier);
		return sup?.supplierName || 'All Suppliers';
	});

	const sortLabel = $derived(sortOptions.find((o) => o.value === sortOption)?.label || 'Name (A-Z)');
	const perPageLabel = $derived(perPageOptions.find((o) => o.value === perPage)?.label || '20 per page');

	const hasNonDefaultFilters = $derived(
		(selectedCategory && selectedCategory !== 'all') ||
			(selectedSupplier && selectedSupplier !== 'all') ||
			sortOption !== 'name-asc' ||
			perPage !== '20'
	);
</script>

<svelte:head>
	<title>Shopping List - Busser</title>
</svelte:head>

<InventoryNav />

<ShoppingListHeader summary={data.summary} stats={data.stats} />

<!-- Items to Restock -->
<Card.Root class="mb-6">
	<Card.Header class="pb-4">
		<Card.Title>Items to Restock</Card.Title>
		<p class="text-sm text-muted-foreground">
			Showing {data.items.length} of {data.pagination.total} out-of-stock items
		</p>
	</Card.Header>
	<Card.Content>
		<!-- Toolbar -->
		<div class="flex flex-col gap-3 mb-4">
			<div class="flex items-center gap-2">
				<!-- Search -->
				<form onsubmit={handleSearch} class="flex-1 min-w-0">
					<div class="relative">
						<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search items..."
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
				<FilterButton
					bind:open={filterOpen}
					activeCount={activeFilterCount}
					viewModes={['table', 'grid', 'list']}
					activeView={viewMode}
					onViewChange={setViewMode}
					onRefresh={handleRefresh}
				>
					<!-- category filter -->
					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-1.5">
							<span class="text-sm font-medium text-muted-foreground">Category</span>
							<Select.Root
								type="single"
								value={selectedCategory}
								onValueChange={(v) => handleCategoryChange(v ?? '')}
							>
								<Select.Trigger class="w-full">
									<Select.Value placeholder="All Categories">{categoryLabel}</Select.Value>
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="all" label="All Categories" />
									{#each data.categories as category}
										<Select.Item
											value={String(category.categoryGroupId)}
											label="{category.categoryGroupName} ({category.count})"
										/>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<!-- supplier filter -->
						<div class="flex flex-col gap-1.5">
							<span class="text-sm font-medium text-muted-foreground">Supplier</span>
							<Select.Root
								type="single"
								value={selectedSupplier}
								onValueChange={(v) => handleSupplierChange(v ?? '')}
							>
								<Select.Trigger class="w-full">
									<Select.Value placeholder="All Suppliers">{supplierLabel}</Select.Value>
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="all" label="All Suppliers" />
									{#each data.suppliers as supplier}
										<Select.Item
											value={String(supplier.supplierId)}
											label={supplier.supplierName || 'Unknown'}
										/>
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
								onValueChange={(v) => handleSortChange(v ?? 'name-asc')}
							>
								<Select.Trigger class="w-full">
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
								onValueChange={(v) => handlePerPageChange(v ?? '20')}
							>
								<Select.Trigger class="w-full">
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
								onclick={resetPanelFilters}
								class="text-sm text-muted-foreground hover:text-foreground underline self-start"
							>
								Reset filters
							</button>
						{/if}
					</div>
				</FilterButton>

				<!-- View toggle -->
				<ViewToggle modes={['table', 'grid', 'list']} active={viewMode} onchange={setViewMode} />
			</div>
		</div>

		<!-- Active filters -->
		{#if hasActiveFilters}
			<div class="flex flex-wrap items-center gap-2 mb-4">
				<span class="text-sm text-muted-foreground">Active filters:</span>
				{#if searchInput}
					<Badge variant="secondary" class="gap-1">
						Search: "{searchInput}"
						<button onclick={clearSearch} class="ml-1 hover:text-destructive"><X class="h-3 w-3" /></button>
					</Badge>
				{/if}
				{#if selectedCategory && selectedCategory !== 'all'}
					<Badge variant="secondary" class="gap-1">
						Category: {categoryLabel}
						<button onclick={() => handleCategoryChange('all')} class="ml-1 hover:text-destructive"><X class="h-3 w-3" /></button>
					</Badge>
				{/if}
				{#if selectedSupplier && selectedSupplier !== 'all'}
					<Badge variant="secondary" class="gap-1">
						Supplier: {supplierLabel}
						<button onclick={() => handleSupplierChange('all')} class="ml-1 hover:text-destructive"><X class="h-3 w-3" /></button>
					</Badge>
				{/if}
				<button onclick={clearAllFilters} class="text-sm text-muted-foreground hover:text-foreground underline">
					Clear all
				</button>
			</div>
		{/if}

		<!-- Bulk Action Bar -->
		{#if canModify && selectedIds.length > 0}
			<div
				class="sticky top-0 z-10 mb-4 rounded-lg border border-border/50 bg-background/80 backdrop-blur-md px-4 py-3 shadow-sm"
			>
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium">{selectedIds.length} selected</span>
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onclick={handleBulkRestock}
							disabled={bulkActionLoading}
						>
							<PackageCheck class="h-4 w-4 sm:mr-1.5" />
							<span class="hidden sm:inline">Restock</span>
						</Button>
						<Button variant="ghost" size="sm" onclick={clearSelection}>
							<X class="h-4 w-4 mr-1.5" />
							Clear
						</Button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Content -->
		{#if data.items.length === 0}
			<div class="flex flex-col items-center justify-center py-16 text-center">
				<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
					<ShoppingCart class="h-10 w-10 text-muted-foreground/50" />
				</div>
				<h3 class="text-xl font-semibold mb-2">
					{#if hasActiveFilters}
						No Matching Items
					{:else}
						All Stocked Up
					{/if}
				</h3>
				<p class="text-muted-foreground max-w-md">
					{#if hasActiveFilters}
						No items match your current filters. Try adjusting your search or clearing filters.
					{:else}
						Everything in your inventory is in stock. When items run out, they'll appear here.
					{/if}
				</p>
				{#if hasActiveFilters}
					<Button variant="outline" class="mt-4" onclick={clearAllFilters}>Clear Filters</Button>
				{/if}
			</div>
		{:else if viewMode === 'table'}
			<!-- Table View -->
			{#if canModify}
				<div class="flex sm:hidden items-center gap-2 px-3 py-2 mb-1">
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div onclick={(e) => e.stopPropagation()}>
						<Checkbox checked={allSelected} onchange={toggleAll} />
					</div>
					<span class="text-sm text-muted-foreground">Select all</span>
				</div>
			{/if}

			<div class="glass-table overflow-x-auto">
				<Table.Root>
					<Table.Header class="glass-table-header hidden sm:table-header-group">
						<Table.Row>
							{#if canModify}
								<Table.Head class="w-10">
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_static_element_interactions -->
									<div class="flex items-center justify-center" onclick={(e) => e.stopPropagation()}>
										<Checkbox checked={allSelected} onchange={toggleAll} />
									</div>
								</Table.Head>
							{/if}
							<Table.Head>Name</Table.Head>
							<Table.Head class="hidden sm:table-cell">Category</Table.Head>
							<Table.Head class="hidden sm:table-cell">Supplier</Table.Head>
							<Table.Head class="hidden sm:table-cell text-center">Recipes</Table.Head>
							<Table.Head class="hidden sm:table-cell text-center">Impact</Table.Head>
							<Table.Head class="hidden sm:table-cell text-right">Price</Table.Head>
							<Table.Head class="w-20"></Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each data.items as item (item.productId)}
							{@const impact = getImpactLevel(item)}
							{@const isRestocking = restockingIds.has(item.productId)}
							<Table.Row class={cn('glass-table-row', isRestocking && 'opacity-50')}>
								{#if canModify}
									<Table.Cell class="w-10">
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div class="flex items-center justify-center" onclick={(e) => e.stopPropagation()}>
											<Checkbox
												checked={selectedIds.includes(item.productId)}
												onchange={() => toggleSelection(item.productId)}
											/>
										</div>
									</Table.Cell>
								{/if}
								<Table.Cell>
									<span class={cn(isRestocking && 'line-through')}>{item.productName}</span>
								</Table.Cell>
								<Table.Cell class="hidden sm:table-cell">
									<Badge variant="secondary">{item.categoryName}</Badge>
								</Table.Cell>
								<Table.Cell class="hidden sm:table-cell">
									{item.supplierName || 'Any'}
								</Table.Cell>
								<Table.Cell class="hidden sm:table-cell">
									{#if item.recipeCount > 0}
										<div class="flex justify-center">
											<Badge variant="secondary" class="gap-1">
												<FlaskConical class="h-3 w-3" />
												{item.recipeCount}
											</Badge>
										</div>
									{:else}
										<div class="flex justify-center">
											<span class="text-muted-foreground text-sm">-</span>
										</div>
									{/if}
								</Table.Cell>
								<Table.Cell class="hidden sm:table-cell">
									{#if impact > 0}
										<div class="flex justify-center gap-0.5" title="Unlocks {item.unlockableRecipes} recipe(s)">
											{#each Array(impact) as _}
												<Flame
													class={cn(
														'h-3.5 w-3.5',
														impact === 3 ? 'text-red-500' : impact === 2 ? 'text-orange-500' : 'text-yellow-500'
													)}
												/>
											{/each}
										</div>
									{:else}
										<div class="flex justify-center">
											<span class="text-muted-foreground text-sm">-</span>
										</div>
									{/if}
								</Table.Cell>
								<Table.Cell class="hidden sm:table-cell text-right tabular-nums">
									{#if item.productPricePerUnit > 0}
										${item.productPricePerUnit.toFixed(2)}
									{:else}
										-
									{/if}
								</Table.Cell>
								<Table.Cell>
									{#if canModify && !isRestocking}
										<Button
											variant="ghost"
											size="sm"
											class="h-7 text-xs"
											onclick={() => handleToggle(item.productId)}
										>
											<PackageCheck class="h-3.5 w-3.5 mr-1" />
											Restock
										</Button>
									{:else if isRestocking}
										<Badge variant="secondary">Restocked</Badge>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<Pagination pagination={data.pagination} itemLabel="items" onNavigate={navigatePage} />
		{:else}
			<!-- Grid/List View -->
			<div
				class={cn(
					viewMode === 'grid'
						? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
						: 'flex flex-col gap-3'
				)}
			>
				{#each data.items as item (item.productId)}
					{@const impact = getImpactLevel(item)}
					{@const isRestocking = restockingIds.has(item.productId)}

					{#if viewMode === 'grid'}
						<Card.Root class={cn('overflow-hidden transition-all duration-300', isRestocking && 'opacity-50')}>
							<div class="relative h-36 overflow-hidden">
								<SkeletonImage
									src={item.productImageUrl}
									alt={item.productName}
									variant="product"
									class="h-full w-full"
								/>
								<Badge variant="secondary" class="absolute top-3 left-3 bg-background/80 backdrop-blur-sm">
									{item.categoryName}
								</Badge>
								{#if impact > 0}
									<div class="absolute top-3 right-3 flex gap-0.5" title="Unlocks {item.unlockableRecipes} recipe(s)">
										{#each Array(impact) as _}
											<Flame
												class={cn(
													'h-4 w-4',
													impact === 3 ? 'text-red-500' : impact === 2 ? 'text-orange-500' : 'text-yellow-500'
												)}
											/>
										{/each}
									</div>
								{/if}
							</div>
							<Card.Content class="p-4">
								<h3 class={cn('font-bold text-base mb-1 line-clamp-1', isRestocking && 'line-through')}>
									{item.productName}
								</h3>
								<div class="flex items-center justify-between mt-2">
									<div class="flex items-center gap-2">
										{#if item.recipeCount > 0}
											<span class="flex items-center gap-1 text-xs text-muted-foreground">
												<FlaskConical class="h-3 w-3" />{item.recipeCount}
											</span>
										{/if}
										{#if item.productPricePerUnit > 0}
											<span class="text-sm font-medium tabular-nums">${item.productPricePerUnit.toFixed(2)}</span>
										{/if}
									</div>
									{#if canModify && !isRestocking}
										<Button variant="outline" size="sm" class="h-7 text-xs" onclick={() => handleToggle(item.productId)}>
											<PackageCheck class="h-3.5 w-3.5 mr-1" />
											Restock
										</Button>
									{:else if isRestocking}
										<Badge variant="secondary">Restocked</Badge>
									{/if}
								</div>
							</Card.Content>
						</Card.Root>
					{:else}
						<!-- List View -->
						<Card.Root class={cn('transition-all duration-200', isRestocking && 'opacity-50')}>
							<div class="flex items-center gap-4 p-3">
								<SkeletonImage
									src={item.productImageUrl}
									alt={item.productName}
									variant="product"
									class="w-16 h-16 shrink-0 rounded-lg"
								/>
								<div class="flex-1 min-w-0">
									<h3 class={cn('font-bold text-base truncate', isRestocking && 'line-through')}>
										{item.productName}
									</h3>
									<div class="flex items-center gap-2 mt-1">
										<Badge variant="secondary" class="text-[10px]">{item.categoryName}</Badge>
										{#if item.recipeCount > 0}
											<span class="flex items-center gap-1 text-xs text-muted-foreground">
												<FlaskConical class="h-3 w-3" />{item.recipeCount}
											</span>
										{/if}
										{#if impact > 0}
											<div class="flex gap-0.5">
												{#each Array(impact) as _}
													<Flame
														class={cn(
															'h-3 w-3',
															impact === 3 ? 'text-red-500' : impact === 2 ? 'text-orange-500' : 'text-yellow-500'
														)}
													/>
												{/each}
											</div>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-3 shrink-0">
									{#if item.productPricePerUnit > 0}
										<span class="text-sm font-medium tabular-nums">${item.productPricePerUnit.toFixed(2)}</span>
									{/if}
									{#if canModify && !isRestocking}
										<Button variant="outline" size="sm" class="h-7 text-xs" onclick={() => handleToggle(item.productId)}>
											<PackageCheck class="h-3.5 w-3.5 mr-1" />
											Restock
										</Button>
									{:else if isRestocking}
										<Badge variant="secondary">Restocked</Badge>
									{/if}
								</div>
							</div>
						</Card.Root>
					{/if}
				{/each}
			</div>

			<Pagination pagination={data.pagination} itemLabel="items" onNavigate={navigatePage} />
		{/if}
	</Card.Content>
</Card.Root>

<!-- Saved Suppliers -->
<Card.Root class="mb-6">
	<Card.Header class="pb-4">
		<Card.Title>Saved Suppliers</Card.Title>
		<p class="text-sm text-muted-foreground">
			Your saved stores and suppliers
		</p>
	</Card.Header>
	<Card.Content>
		{#if savedSuppliers.length > 0}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each savedSuppliers as supplier (supplier.supplierId)}
					<SupplierCard
						{supplier}
						productCount={supplierProductCounts.get(supplier.supplierId) || 0}
						onRemove={canModify ? handleRemoveSupplier : undefined}
					/>
				{/each}
			</div>
		{:else}
			<p class="text-sm text-muted-foreground text-center py-8">
				No suppliers saved yet. Use the nearby search below to find and add stores.
			</p>
		{/if}
	</Card.Content>
</Card.Root>

<!-- Nearby Store Search -->
{#if canModify}
	<Card.Root class="mb-6">
		<Card.Content class="pt-6">
			<NearbyStoreSearch onAdd={handleAddSupplier} />
		</Card.Content>
	</Card.Root>
{/if}
