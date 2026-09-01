<script lang="ts">
	import {
		Compass,
		FlaskConical,
		GlassWater,
		Mail,
		Plus,
		Search,
		SlidersHorizontal,
		Sparkles,
		Wine,
		X,
	} from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { browser } from '$app/environment';

	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import FancyAlert from '$lib/components/FancyAlert.svelte';
	import FancyBadge from '$lib/components/FancyBadge.svelte';
	import FancyButton from '$lib/components/FancyButton.svelte';
	import AdvancedSearchDialog from '$lib/components/AdvancedSearchDialog.svelte';
	import CatalogBrowseCard from '$lib/components/CatalogBrowseCard.svelte';
	import CatalogFilterPanel from '$lib/components/CatalogFilterPanel.svelte';
	import CatalogResultsSkeleton from '$lib/components/CatalogResultsSkeleton.svelte';
	import FilterButton from '$lib/components/FilterButton.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import StatBadge from '$lib/components/StatBadge.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import SubNav from '$lib/components/SubNav.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';
	import { cn } from '$lib/utils';

	import { workspaceSwitching } from '../../../stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';
	const authenticated = $derived(!!$page.data.user);
	let viewMode = $state<'grid' | 'list'>('grid');

	// svelte-ignore state_referenced_locally
	let searchInput = $state(data.filters.search || '');
	// svelte-ignore state_referenced_locally
	let selectedSort = $state(data.filters.sort || 'name-asc');
	// svelte-ignore state_referenced_locally
	let selectedSpirit = $state(data.filters.spiritId || 'all');
	// svelte-ignore state_referenced_locally
	let selectedShowFilter = $state(data.filters.showFilter || 'all');
	// svelte-ignore state_referenced_locally
	let perPage = $state(String(data.filters.perPage ?? 24));
	// svelte-ignore state_referenced_locally
	let selectedMood = $state(data.filters.mood || '');

	const makeableLensAvailable = $derived(data.makeableLensAvailable);
	const readyLensOn = $derived(data.filters.readyToMake === '1');

	let filterOpen = $state(false);

	const activeFilterCount = $derived.by(() => {
		let count = 0;
		if (selectedSpirit && selectedSpirit !== 'all') count++;
		if (selectedShowFilter && selectedShowFilter !== 'all') count++;
		if (selectedSort !== 'name-asc') count++;
		if (perPage !== '24') count++;
		if (selectedMood) count++;
		return count;
	});

	let advancedSearchOpen = $state(false);
	const advancedParamKeys = [
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

	// svelte-ignore state_referenced_locally
	let favorites = $state(new Set(data.favoriteRecipeIds));
	// svelte-ignore state_referenced_locally
	let featured = $state(new Set(data.featuredRecipeIds));

	function resetPanelFilters() {
		selectedSpirit = 'all';
		selectedShowFilter = 'all';
		selectedSort = 'name-asc';
		perPage = '24';
		selectedMood = '';
		goto(
			buildUrl({
				spirit: 'all',
				show: 'all',
				sort: 'name-asc',
				perPage: '24',
				mood: '',
				page: 1,
			}),
			{
				keepFocus: true,
			}
		);
	}

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
		const pp = overrides.perPage !== undefined ? overrides.perPage : perPage;
		const pageNum = overrides.page !== undefined ? overrides.page : 1;
		const mood = overrides.mood !== undefined ? overrides.mood : selectedMood;

		params.set('page', String(pageNum));
		if (search) params.set('search', String(search));
		if (sort && sort !== 'name-asc') params.set('sort', String(sort));
		if (spirit && spirit !== 'all') params.set('spirit', String(spirit));
		if (show && show !== 'all') params.set('show', String(show));
		if (pp && String(pp) !== '24') params.set('perPage', String(pp));
		if (mood) params.set('mood', String(mood));

		if (makeableLensAvailable) {
			const ready =
				overrides.readyToMake !== undefined ? overrides.readyToMake : readyLensOn ? '1' : null;
			if (ready === '1') params.set('readyToMake', '1');
		}

		// preserve advanced filter params
		for (const key of advancedParamKeys) {
			const val = overrides[key] !== undefined ? overrides[key] : data.filters[key];
			if (val) params.set(key, String(val));
		}

		const queryString = params.toString();
		return queryString ? `/catalog?${queryString}` : '/catalog';
	}

	function handleMoodChange(moodId: string) {
		selectedMood = selectedMood === moodId ? '' : moodId;
		goto(buildUrl({ mood: selectedMood || null, page: 1 }), { keepFocus: true });
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

	function setLens(on: boolean) {
		goto(buildUrl({ readyToMake: on ? '1' : null, page: 1 }), { keepFocus: true });
	}

	function handlePerPageChange(value: string) {
		perPage = value;
		goto(buildUrl({ perPage: value, page: 1 }), { keepFocus: true });
	}

	function clearSearch() {
		searchInput = '';
		goto(buildUrl({ search: '' }), { keepFocus: true });
	}

	function handleAdvancedSearch(params: Record<string, string>) {
		const overrides: Record<string, string | number | null> = { page: 1 };
		for (const key of advancedParamKeys) {
			overrides[key] = null;
		}
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

	$effect(() => {
		searchInput = data.filters.search || '';
		selectedSort = data.filters.sort || 'name-asc';
		selectedSpirit = data.filters.spiritId || 'all';
		selectedShowFilter = data.filters.showFilter || 'all';
		perPage = String(data.filters.perPage ?? 24);
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
	<title>Catalog - Busser</title>
	<meta
		name="description"
		content="Browse and search our complete collection of cocktail recipes. Filter by spirit, strength, ingredients, and more."
	/>
	<meta property="og:title" content="Cocktail Catalog - Busser" />
	<meta
		property="og:description"
		content="Search and filter cocktail recipes by spirit, strength, ingredients, and more."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://busserapp.com/catalog" />
	<meta property="og:image" content="https://busserapp.com/og-image.png" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div>
	{#if !authenticated}
		<FancyAlert class="mb-6">
			{#snippet icon()}<Mail class="h-5 w-5 text-primary" />{/snippet}
			{#snippet children()}
				<p class="sm:hidden">Sign up to save favorites</p>
				<p class="hidden sm:block">
					Sign up to <strong>save favorites</strong> and build your own bar.
				</p>
			{/snippet}
			{#snippet action()}
				<FancyButton size="sm" variant="primary" href="/signup">Sign Up</FancyButton>
			{/snippet}
		</FancyAlert>
	{/if}

	{#if authenticated}
		<!-- Section nav + primary action above the hero; explore lives here as a tab -->
		<SubNav
			tabs={[
				{ href: '/catalog', label: 'Browse', icon: Wine, match: (p) => p === '/catalog' },
				{ href: '/catalog/explore', label: 'Explore', icon: Compass },
			]}
		>
			{#snippet action()}
				{#if canModify}
					<FancyButton href="/catalog/add" variant="primary" size="sm" class="shrink-0">
						<Plus class="h-4 w-4 mr-1" />
						Add Recipe
					</FancyButton>
				{/if}
			{/snippet}
		</SubNav>

		<!-- Hero Section -->
		<PageHero
			title="Catalog"
			subtitle="Browse cocktails and find what you can make with what's on hand."
		>
			<div class="flex gap-2 flex-wrap pb-1 -mb-1">
				<StatBadge class="whitespace-nowrap">
					<Wine class="h-4 w-4 text-primary shrink-0" />
					<span class="text-sm font-bold">{data.pagination.total}</span>
					<span class="text-xs text-muted-foreground">Recipes</span>
				</StatBadge>

				<!-- todo: make these badges filter the catalog (readyToMake=1, and an almostThere filter that
				     doesn't exist yet). links dropped for now so they're stat-only, not dead clicks. -->
				{#if !$page.data.isGlobalWorkspace}
					<StatBadge class="whitespace-nowrap">
						<Sparkles class="h-4 w-4 text-primary shrink-0" />
						<span class="text-sm font-bold">{data.availableCount}</span>
						<span class="text-xs text-muted-foreground">Ready</span>
					</StatBadge>

					{#if data.almostThereCount > 0}
						<StatBadge class="whitespace-nowrap">
							<GlassWater class="h-4 w-4 text-primary shrink-0" />
							<span class="text-sm font-bold">{data.almostThereCount}</span>
							<span class="text-xs text-muted-foreground">Almost There</span>
						</StatBadge>
					{/if}
				{/if}

				{#if selectedSpirit && selectedSpirit !== 'all'}
					{@const spiritObj = data.spirits.find(
						(s) => String(s.recipeCategoryId) === selectedSpirit
					)}
					{#if spiritObj}
						<FancyBadge class="whitespace-nowrap">
							<span class="text-sm font-bold">{spiritObj.recipeCategoryDescription}</span>
							<span class="text-xs text-muted-foreground">Spirit</span>
						</FancyBadge>
					{/if}
				{/if}

				{#if advancedFilterCount > 0}
					<FancyBadge as="button" onclick={clearAllAdvancedFilters} class="whitespace-nowrap">
						<SlidersHorizontal class="h-4 w-4 text-primary shrink-0" />
						<span class="text-sm font-bold">{advancedFilterCount}</span>
						<span class="text-xs text-muted-foreground"
							>Advanced Filter{advancedFilterCount !== 1 ? 's' : ''}</span
						>
						<X class="h-3 w-3 text-muted-foreground" />
					</FancyBadge>
				{/if}
			</div>
		</PageHero>
	{:else}
		<!-- logged-out: hero hidden to create a curiosity gap around catalog size; keep a heading for seo/a11y -->
		<h1 class="sr-only">Cocktail Catalog</h1>
	{/if}

	<!-- Toolbar -->
	<div class="flex flex-col gap-3 mb-6">
		<div class="flex items-center gap-2">
			<!-- Search -->
			<form onsubmit={handleSearch} class="flex-1 min-w-0">
				<div class="relative">
					<Search
						class="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-4 w-4 text-muted-foreground pointer-events-none"
					/>
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
					{selectedMood}
					sortOption={selectedSort}
					{perPage}
					{advancedFilterCount}
					onSpiritChange={handleSpiritChange}
					onShowFilterChange={handleShowFilterChange}
					onMoodChange={handleMoodChange}
					onSortChange={handleSortChange}
					onPerPageChange={handlePerPageChange}
					onReset={resetPanelFilters}
					onAdvancedClick={() => {
						filterOpen = false;
						advancedSearchOpen = true;
					}}
				/>
			</FilterButton>

			<!-- View toggle -->
			<ViewToggle modes={['grid', 'list']} active={viewMode} onchange={setViewMode} />
		</div>
	</div>

	<!-- Makeability lens: the primary "what can I make" axis, with an obvious one-tap widen -->
	{#if makeableLensAvailable && selectedShowFilter === 'all'}
		<div class="flex items-center gap-1 mb-4 p-1 rounded-full bg-muted/50 w-fit">
			<button
				type="button"
				onclick={() => setLens(true)}
				class={cn(
					'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
					readyLensOn
						? 'bg-primary text-primary-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				)}
			>
				Ready to make
			</button>
			<button
				type="button"
				onclick={() => setLens(false)}
				class={cn(
					'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
					!readyLensOn
						? 'bg-primary text-primary-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground'
				)}
			>
				All recipes
			</button>
		</div>
	{/if}

	<!-- Active Advanced Filter Tags -->
	{#if advancedFilterCount > 0}
		<div class="flex flex-wrap items-center gap-2 mb-4">
			<span class="text-sm text-muted-foreground">Filters:</span>
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
	{#if $workspaceSwitching}
		<CatalogResultsSkeleton {viewMode} count={data.recipes.length || 8} />
	{:else if data.recipes.length === 0 && makeableLensAvailable && readyLensOn && !searchInput && advancedFilterCount === 0 && selectedShowFilter === 'all'}
		<!-- makeable=0 first-run: teach the model instead of looking broken; widening is one tap -->
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
				<div class="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
					<Sparkles class="h-10 w-10 text-primary/60" />
				</div>
				<h3 class="text-xl font-semibold mb-2">Nothing to make just yet</h3>
				<p class="text-muted-foreground mb-6 max-w-md">
					Add a few bottles to your shelf and we'll show what you can pour. Or browse the full
					catalog for ideas.
				</p>
				<div class="flex flex-wrap gap-2 justify-center">
					<a href="/inventory" class={buttonVariants()}>Add to your shelf</a>
					<Button variant="outline" onclick={() => setLens(false)}>Show all recipes</Button>
					<a href="/catalog/explore" class={buttonVariants({ variant: 'ghost' })}>Explore</a>
				</div>
			</Card.Content>
		</Card.Root>
	{:else if data.recipes.length === 0}
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
					{authenticated}
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
