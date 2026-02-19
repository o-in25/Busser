<script lang="ts">
	import { FlaskConical, Plus, Search, X } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { browser } from '$app/environment';

	import { goto, invalidateAll } from '$app/navigation';
	import AdvancedSearchDialog from '$lib/components/AdvancedSearchDialog.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import CatalogBrowseCard from '$lib/components/CatalogBrowseCard.svelte';
	import CatalogFilterPanel from '$lib/components/CatalogFilterPanel.svelte';
	import FilterButton from '$lib/components/FilterButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';
	import { cn } from '$lib/utils';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	// View mode
	let viewMode = $state<'grid' | 'list'>('grid');

	// Filter state
	let searchInput = $state(data.filters.search || '');
	let selectedSort = $state(data.filters.sort || 'name-asc');
	let selectedSpirit = $state(data.filters.spiritId || 'all');
	let selectedShowFilter = $state(data.filters.showFilter || 'all');

	// Filter panel state
	let filterOpen = $state(false);

	// count of non-default filters behind the filter panel
	const activeFilterCount = $derived.by(() => {
		let count = 0;
		if (selectedSpirit && selectedSpirit !== 'all') count++;
		if (selectedShowFilter && selectedShowFilter !== 'all') count++;
		if (selectedSort !== 'name-asc') count++;
		return count;
	});

	// Advanced search
	let advancedSearchOpen = $state(false);
	const advancedParamKeys = [
		'readyToMake',
		'ingredientInclude',
		'ingredientAny',
		'ingredientExclude',
		'strengthMin',
		'strengthMax',
		'ingredientCountMin',
		'ingredientCountMax',
		'method',
		'ratingMin',
		'ratingMax',
	] as const;
	const advancedFilterCount = $derived(advancedParamKeys.filter((k) => !!data.filters[k]).length);

	// Track favorites/featured for optimistic updates
	let favorites = $state(new Set(data.favoriteRecipeIds));
	let featured = $state(new Set(data.featuredRecipeIds));

	// reset filters behind the panel (spirit, show, sort)
	function resetPanelFilters() {
		selectedSpirit = 'all';
		selectedShowFilter = 'all';
		selectedSort = 'name-asc';
		goto(buildUrl({ spirit: 'all', show: 'all', sort: 'name-asc', page: 1 }), { keepFocus: true });
	}

	// Restore view mode from localStorage
	onMount(() => {
		const savedViewMode = localStorage.getItem('catalog-browse-view-mode');
		if (savedViewMode === 'list' || savedViewMode === 'grid') {
			viewMode = savedViewMode;
		}
	});

	function setViewMode(mode: 'grid' | 'list') {
		viewMode = mode;
		if (browser) {
			localStorage.setItem('catalog-browse-view-mode', mode);
		}
	}

	function buildUrl(overrides: Record<string, string | number | null> = {}) {
		const params = new URLSearchParams();

		const search = overrides.search !== undefined ? overrides.search : searchInput;
		const sort = overrides.sort !== undefined ? overrides.sort : selectedSort;
		const spirit = overrides.spirit !== undefined ? overrides.spirit : selectedSpirit;
		const show = overrides.show !== undefined ? overrides.show : selectedShowFilter;
		const pageNum = overrides.page !== undefined ? overrides.page : 1;

		params.set('page', String(pageNum));
		if (search) params.set('search', String(search));
		if (sort && sort !== 'name-asc') params.set('sort', String(sort));
		if (spirit && spirit !== 'all') params.set('spirit', String(spirit));
		if (show && show !== 'all') params.set('show', String(show));

		// preserve advanced filter params
		for (const key of advancedParamKeys) {
			const val = overrides[key] !== undefined ? overrides[key] : data.filters[key];
			if (val) params.set(key, String(val));
		}

		const queryString = params.toString();
		return queryString ? `/catalog/browse?${queryString}` : '/catalog/browse';
	}

	function handleSearch(e: Event) {
		e.preventDefault();
		goto(buildUrl({ page: 1 }), { keepFocus: true });
	}

	function handleSortChange(value: string) {
		selectedSort = value;
		goto(buildUrl({ sort: value, page: 1 }), { keepFocus: true });
	}

	function handleSpiritChange(value: string) {
		selectedSpirit = value;
		goto(buildUrl({ spirit: value, page: 1 }), { keepFocus: true });
	}

	function handleShowFilterChange(value: string) {
		selectedShowFilter = value;
		goto(buildUrl({ show: value, page: 1 }), { keepFocus: true });
	}

	function clearSearch() {
		searchInput = '';
		goto(buildUrl({ search: '' }), { keepFocus: true });
	}

	function handleAdvancedSearch(params: Record<string, string>) {
		const overrides: Record<string, string | number | null> = { page: 1 };
		// clear all advanced params first
		for (const key of advancedParamKeys) {
			overrides[key] = null;
		}
		// apply new ones
		for (const [key, val] of Object.entries(params)) {
			overrides[key] = val;
		}
		goto(buildUrl(overrides));
	}

	function clearAdvancedFilter(...keys: string[]) {
		const overrides: Record<string, string | number | null> = { page: 1 };
		for (const key of keys) {
			overrides[key] = null;
		}
		goto(buildUrl(overrides));
	}

	function clearAllAdvancedFilters() {
		const overrides: Record<string, string | number | null> = { page: 1 };
		for (const key of advancedParamKeys) {
			overrides[key] = null;
		}
		goto(buildUrl(overrides));
	}

	function navigatePage(pageNum: number) {
		goto(buildUrl({ page: pageNum }));
	}

	// Update local state when page data changes
	$effect(() => {
		searchInput = data.filters.search || '';
		selectedSort = data.filters.sort || 'name-asc';
		selectedSpirit = data.filters.spiritId || 'all';
		selectedShowFilter = data.filters.showFilter || 'all';
		favorites = new Set(data.favoriteRecipeIds);
		featured = new Set(data.featuredRecipeIds);
	});

	function handleToggleFavorite(id: number) {
		const newFavorites = new Set(favorites);
		if (newFavorites.has(id)) {
			newFavorites.delete(id);
		} else {
			newFavorites.add(id);
		}
		favorites = newFavorites;
	}

	function handleToggleFeatured(id: number) {
		const newFeatured = new Set(featured);
		if (newFeatured.has(id)) {
			newFeatured.delete(id);
		} else {
			newFeatured.add(id);
		}
		featured = newFeatured;
	}
</script>

<svelte:head>
	<title>Browse Catalog - Busser</title>
</svelte:head>

<div class="container mx-auto px-4 mt-4">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6">
		<BackButton href="/catalog" />
		<div>
			<h1 class="text-2xl font-bold">Browse Catalog</h1>
			<p class="text-muted-foreground">
				{data.pagination.total}
				{data.pagination.total === 1 ? 'recipe' : 'recipes'} in your collection
			</p>
		</div>
	</div>

	<!-- Toolbar -->
	<div class="flex flex-col gap-3 mb-6">
		<div class="flex items-center gap-2">
			<!-- Search -->
			<form onsubmit={handleSearch} class="flex-1 min-w-0">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search recipes..."
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
				activeCount={activeFilterCount + advancedFilterCount}
				viewModes={['grid', 'list']}
				activeView={viewMode}
				onViewChange={setViewMode}
				onRefresh={invalidateAll}
			>
				<CatalogFilterPanel
					spirits={data.spirits}
					{selectedSpirit}
					{selectedShowFilter}
					sortOption={selectedSort}
					{advancedFilterCount}
					onSpiritChange={handleSpiritChange}
					onShowFilterChange={handleShowFilterChange}
					onSortChange={handleSortChange}
					onReset={resetPanelFilters}
					onAdvancedClick={() => {
						filterOpen = false;
						advancedSearchOpen = true;
					}}
				/>
			</FilterButton>

			<!-- View toggle -->
			<ViewToggle modes={['grid', 'list']} active={viewMode} onchange={setViewMode} />

			<!-- Add Recipe -->
			{#if canModify}
				<a href="/catalog/add" class={cn(buttonVariants(), 'shrink-0 w-10 px-0 sm:w-auto sm:px-4')}>
					<Plus class="h-4 w-4 sm:mr-2" />
					<span class="hidden sm:inline">Add Recipe</span>
				</a>
			{/if}
		</div>
	</div>

	<!-- Active Advanced Filter Tags -->
	{#if advancedFilterCount > 0}
		<div class="flex flex-wrap items-center gap-2 mb-4">
			<span class="text-sm text-muted-foreground">Filters:</span>
			{#if data.filters.readyToMake}
				<Badge variant="secondary" class="gap-1">
					Ready to Make
					<button
						onclick={() => clearAdvancedFilter('readyToMake')}
						class="ml-1 hover:text-destructive"
					>
						<X class="h-3 w-3" />
					</button>
				</Badge>
			{/if}
			{#if data.filters.ingredientInclude}
				{@const names = data.filters.ingredientNames || {}}
				{@const ids = data.filters.ingredientInclude.split(',').map(Number)}
				<Badge variant="secondary" class="gap-1">
					Must include: {ids.map((id) => names[id] || id).join(', ')}
					<button
						onclick={() => clearAdvancedFilter('ingredientInclude')}
						class="ml-1 hover:text-destructive"
					>
						<X class="h-3 w-3" />
					</button>
				</Badge>
			{/if}
			{#if data.filters.ingredientAny}
				{@const names = data.filters.ingredientNames || {}}
				{@const ids = data.filters.ingredientAny.split(',').map(Number)}
				<Badge variant="secondary" class="gap-1">
					Any of: {ids.map((id) => names[id] || id).join(', ')}
					<button
						onclick={() => clearAdvancedFilter('ingredientAny')}
						class="ml-1 hover:text-destructive"
					>
						<X class="h-3 w-3" />
					</button>
				</Badge>
			{/if}
			{#if data.filters.ingredientExclude}
				{@const names = data.filters.ingredientNames || {}}
				{@const ids = data.filters.ingredientExclude.split(',').map(Number)}
				<Badge variant="destructive" class="gap-1">
					Excludes: {ids.map((id) => names[id] || id).join(', ')}
					<button
						onclick={() => clearAdvancedFilter('ingredientExclude')}
						class="ml-1 hover:text-destructive-foreground"
					>
						<X class="h-3 w-3" />
					</button>
				</Badge>
			{/if}
			{#if data.filters.strengthMin || data.filters.strengthMax}
				<Badge variant="secondary" class="gap-1">
					Strength: {data.filters.strengthMin || '0'}-{data.filters.strengthMax || '10'}
					<button
						onclick={() => clearAdvancedFilter('strengthMin', 'strengthMax')}
						class="ml-1 hover:text-destructive"
					>
						<X class="h-3 w-3" />
					</button>
				</Badge>
			{/if}
			{#if data.filters.ingredientCountMin || data.filters.ingredientCountMax}
				<Badge variant="secondary" class="gap-1">
					Ingredients: {data.filters.ingredientCountMin || '0'}-{data.filters.ingredientCountMax ||
						'15'}
					<button
						onclick={() => clearAdvancedFilter('ingredientCountMin', 'ingredientCountMax')}
						class="ml-1 hover:text-destructive"
					>
						<X class="h-3 w-3" />
					</button>
				</Badge>
			{/if}
			{#if data.filters.method}
				{@const pm = data.preparationMethods.find(
					(p) => String(p.recipeTechniqueDescriptionId) === data.filters.method
				)}
				<Badge variant="secondary" class="gap-1">
					Method: {pm?.recipeTechniqueDescriptionText || data.filters.method}
					<button onclick={() => clearAdvancedFilter('method')} class="ml-1 hover:text-destructive">
						<X class="h-3 w-3" />
					</button>
				</Badge>
			{/if}
			{#if data.filters.ratingMin || data.filters.ratingMax}
				<Badge variant="secondary" class="gap-1">
					Rating: {data.filters.ratingMin || '0'}-{data.filters.ratingMax || '10'}
					<button
						onclick={() => clearAdvancedFilter('ratingMin', 'ratingMax')}
						class="ml-1 hover:text-destructive"
					>
						<X class="h-3 w-3" />
					</button>
				</Badge>
			{/if}
			<Button variant="ghost" size="sm" onclick={clearAllAdvancedFilters}>Clear all</Button>
		</div>
	{/if}

	<!-- Results -->
	{#if data.recipes.length === 0}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
				<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
					<FlaskConical class="h-10 w-10 text-muted-foreground/50" />
				</div>
				<h3 class="text-xl font-semibold mb-2">No Recipes Found</h3>
				<p class="text-muted-foreground mb-6 max-w-md">
					{#if searchInput || advancedFilterCount > 0}
						No recipes match your filters. Try adjusting your search criteria.
					{:else}
						Your catalog is empty. Start by adding your first recipe!
					{/if}
				</p>
				{#if searchInput || advancedFilterCount > 0}
					<div class="flex gap-2">
						{#if searchInput}
							<Button variant="outline" onclick={clearSearch}>Clear Search</Button>
						{/if}
						{#if advancedFilterCount > 0}
							<Button variant="outline" onclick={clearAllAdvancedFilters}
								>Clear Advanced Filters</Button
							>
						{/if}
					</div>
				{:else}
					<a href="/catalog/add" class={buttonVariants()}> Add Recipe </a>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<div
			class={cn(
				viewMode === 'grid'
					? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
					: 'flex flex-col gap-3'
			)}
		>
			{#each data.recipes as recipe (recipe.recipeId)}
				<CatalogBrowseCard
					{recipe}
					{viewMode}
					isFavorite={favorites.has(recipe.recipeId)}
					isFeatured={featured.has(recipe.recipeId)}
					{canModify}
					workspaceId={workspace.workspaceId}
					actionPath="?"
					onToggleFavorite={handleToggleFavorite}
					onToggleFeatured={handleToggleFeatured}
				/>
			{/each}
		</div>

		<!-- Pagination -->
		<Pagination pagination={data.pagination} itemLabel="recipes" onNavigate={navigatePage} />
	{/if}
</div>

<AdvancedSearchDialog
	bind:open={advancedSearchOpen}
	preparationMethods={data.preparationMethods}
	filters={data.filters}
	onsearch={handleAdvancedSearch}
/>
