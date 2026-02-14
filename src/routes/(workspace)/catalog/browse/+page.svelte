<script lang="ts">
	import {
		ArrowUpDown,
		ChevronLeft,
		ChevronRight,
		Filter,
		FlaskConical,
		GlassWater,
		Heart,
		LayoutGrid,
		List,
		Plus,
		Search,
		SlidersHorizontal,
		Star,
		X,
	} from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { browser } from '$app/environment';

	import { goto } from '$app/navigation';
	import AdvancedSearchDialog from '$lib/components/AdvancedSearchDialog.svelte';
	import BackButton from '$lib/components/BackButton.svelte';
	import CatalogBrowseCard from '$lib/components/CatalogBrowseCard.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
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

	// Sort options
	const sortOptions = [
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'top-rated', label: 'Top Rated' },
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
	];

	// Show filter options
	const showFilterOptions = [
		{ value: 'all', label: 'All Recipes', icon: FlaskConical },
		{ value: 'favorites', label: 'My Favorites', icon: Heart },
		{ value: 'featured', label: 'Featured', icon: Star },
	];

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

	// Generate page links
	const pages = $derived.by(() => {
		const { total, perPage, currentPage } = data.pagination;
		const totalPages = Math.ceil(total / perPage);
		return Array.from({ length: totalPages }, (_, i) => ({
			number: i + 1,
			active: i + 1 === currentPage,
		}));
	});

	// Update local state when page data changes
	$effect(() => {
		searchInput = data.filters.search || '';
		selectedSort = data.filters.sort || 'name-asc';
		selectedSpirit = data.filters.spiritId || 'all';
		selectedShowFilter = data.filters.showFilter || 'all';
		favorites = new Set(data.favoriteRecipeIds);
		featured = new Set(data.featuredRecipeIds);
	});

	// Compute display labels for dropdowns
	const sortLabel = $derived.by(() => {
		const option = sortOptions.find((o) => o.value === selectedSort);
		return option?.label || 'Name (A-Z)';
	});

	const spiritLabel = $derived.by(() => {
		if (!selectedSpirit || selectedSpirit === 'all') return 'All Spirits';
		const spirit = data.spirits.find((s) => String(s.recipeCategoryId) === selectedSpirit);
		return spirit?.recipeCategoryDescription || 'All Spirits';
	});

	const showFilterLabel = $derived.by(() => {
		const option = showFilterOptions.find((o) => o.value === selectedShowFilter);
		return option?.label || 'All Recipes';
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
		<BackButton fallback="/catalog" />
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
		<!-- Row 1: Search, Spirit Filter, Sort (+ action buttons on large screens) -->
		<div class="flex flex-wrap gap-3 items-center">
			<!-- Search -->
			<form onsubmit={handleSearch} class="w-full sm:flex-1 sm:min-w-[200px]">
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

			<!-- Advanced Search Button -->
			<Button variant="outline" class="w-auto relative" onclick={() => (advancedSearchOpen = true)}>
				<SlidersHorizontal class="h-4 w-4 mr-2" />
				Advanced
				{#if advancedFilterCount > 0}
					<Badge class="ml-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
						{advancedFilterCount}
					</Badge>
				{/if}
			</Button>

			<!-- Spirit Filter Select -->
			<Select.Root
				type="single"
				value={selectedSpirit}
				onValueChange={(v) => handleSpiritChange(v ?? 'all')}
			>
				<Select.Trigger class="w-[180px]">
					<GlassWater class="h-4 w-4 mr-2" />
					<Select.Value placeholder="All Spirits">{spiritLabel}</Select.Value>
				</Select.Trigger>
				<Select.Content>
					<Select.Item value="all" label="All Spirits" />
					{#if data.spirits.length > 0}
						<Select.Separator />
					{/if}
					{#each data.spirits as spirit}
						<Select.Item
							value={String(spirit.recipeCategoryId)}
							label={spirit.recipeCategoryDescription ?? undefined}
						/>
					{/each}
				</Select.Content>
			</Select.Root>

			<!-- Show Filter Select (Favorites/Featured) -->
			<Select.Root
				type="single"
				value={selectedShowFilter}
				onValueChange={(v) => handleShowFilterChange(v ?? 'all')}
			>
				<Select.Trigger class="w-[160px]">
					<Filter class="h-4 w-4 mr-2" />
					<Select.Value placeholder="All Recipes">{showFilterLabel}</Select.Value>
				</Select.Trigger>
				<Select.Content>
					{#each showFilterOptions as option}
						<Select.Item value={option.value} label={option.label} />
					{/each}
				</Select.Content>
			</Select.Root>

			<!-- Sort Select -->
			<Select.Root
				type="single"
				value={selectedSort}
				onValueChange={(v) => handleSortChange(v ?? 'name-asc')}
			>
				<Select.Trigger class="w-[160px]">
					<ArrowUpDown class="h-4 w-4 mr-2" />
					<Select.Value placeholder="Sort by">{sortLabel}</Select.Value>
				</Select.Trigger>
				<Select.Content>
					{#each sortOptions as option}
						<Select.Item value={option.value} label={option.label} />
					{/each}
				</Select.Content>
			</Select.Root>

			<!-- Action buttons (large screens only - inline with filters) -->
			<div class="hidden lg:flex items-center gap-2">
				<!-- View Toggle -->
				<div class="flex items-center border border-input/50 rounded-lg overflow-hidden">
					<button
						class={cn(
							'h-10 w-10 flex items-center justify-center transition-colors',
							viewMode === 'grid' ? 'bg-secondary text-primary-foreground' : 'hover:bg-muted'
						)}
						onclick={() => setViewMode('grid')}
						aria-label="Grid view"
					>
						<LayoutGrid class="h-4 w-4" />
					</button>
					<button
						class={cn(
							'h-10 w-10 flex items-center justify-center transition-colors',
							viewMode === 'list' ? 'bg-secondary text-primary-foreground' : 'hover:bg-muted'
						)}
						onclick={() => setViewMode('list')}
						aria-label="List view"
					>
						<List class="h-4 w-4" />
					</button>
				</div>

				<!-- Add Recipe Button -->
				{#if canModify}
					<a href="/catalog/add" class={cn(buttonVariants(), 'shrink-0')}>
						<Plus class="h-4 w-4 mr-2" />
						<span>Add Recipe</span>
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

			<!-- Spacer -->
			<div class="flex-1"></div>

			<!-- Add Recipe Button -->
			{#if canModify}
				<a href="/catalog/add" class={cn(buttonVariants(), 'shrink-0')}>
					<Plus class="h-4 w-4 mr-2" />
					<span>Add Recipe</span>
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
		{#if pages.length > 1}
			<div class="flex flex-col items-center justify-center gap-2 py-8">
				<div class="text-sm text-muted-foreground">
					Page <span class="font-semibold">{data.pagination.currentPage}</span>
					of <span class="font-semibold">{pages.length}</span>
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
</div>

<AdvancedSearchDialog
	bind:open={advancedSearchOpen}
	preparationMethods={data.preparationMethods}
	filters={data.filters}
	onsearch={handleAdvancedSearch}
/>
