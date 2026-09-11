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
	import Callout from '$lib/components/Callout.svelte';
	import AdvancedSearchDialog from '$lib/components/AdvancedSearchDialog.svelte';
	import AdvancedSearchFields from '$lib/components/AdvancedSearchFields.svelte';
	import CatalogBrowseCard from '$lib/components/CatalogBrowseCard.svelte';
	import CatalogFilterPanel from '$lib/components/CatalogFilterPanel.svelte';
	import CatalogResultsSkeleton from '$lib/components/CatalogResultsSkeleton.svelte';
	import FilterButton from '$lib/components/FilterButton.svelte';
	import FilterChipDeck from '$lib/components/FilterChipDeck.svelte';
	import PageHero from '$lib/components/PageHero.svelte';
	import StatBadge from '$lib/components/StatBadge.svelte';
	import { Pagination } from '$lib/components/ui/pagination';
	import SubNav from '$lib/components/SubNav.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { roleCanModify, type WorkspaceWithRole } from '$lib/types/workspace';
	import { cn } from '$lib/utils';

	import { workspaceSwitching } from '../../../stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = roleCanModify(workspace?.workspaceRole);
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

	// show filter now lives in a chip deck in the toolbar (drafts is owner/editor-only)
	const showOptions = $derived([
		{ id: 'all', label: 'All Recipes' },
		{ id: 'favorites', label: 'Favorites' },
		{ id: 'featured', label: 'Featured' },
		...(canModify ? [{ id: 'drafts', label: 'Drafts' }] : []),
	]);
	const showActiveLabel = $derived(
		selectedShowFilter !== 'all'
			? (showOptions.find((o) => o.id === selectedShowFilter)?.label ?? '')
			: ''
	);

	const makeableLensAvailable = $derived(data.makeableLensAvailable);
	// active make filter, the primary "what can I pour" axis: 'ready' | 'almost' | '' (all)
	const makeFilter = $derived(data.filters.make ?? '');

	let filterOpen = $state(false);

	const activeFilterCount = $derived.by(() => {
		let count = 0;
		if (selectedSpirit && selectedSpirit !== 'all') count++;
		if (selectedShowFilter && selectedShowFilter !== 'all') count++;
		if (selectedSort !== 'name-asc') count++;
		if (perPage !== '24') count++;
		if (selectedMood) count++;
		if (makeableLensAvailable && makeFilter) count++;
		return count;
	});

	let advancedSearchOpen = $state(false);
	// apply/clear handles the expanded advanced section registers so the sheet footer can drive it
	let advancedApi = $state<{ apply: () => void; clear: () => void } | null>(null);
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
				make: null,
				page: 1,
			}),
			{
				keepFocus: true,
			}
		);
	}

	// mobile sheet "Clear": reset basic filters and wipe advanced params in one go
	function clearSheetFilters() {
		advancedApi?.clear();
		selectedSpirit = 'all';
		selectedShowFilter = 'all';
		selectedSort = 'name-asc';
		perPage = '24';
		selectedMood = '';
		const overrides: Record<string, string | number | null> = {
			spirit: 'all',
			show: 'all',
			sort: 'name-asc',
			perPage: '24',
			mood: '',
			make: null,
			page: 1,
		};
		for (const key of advancedParamKeys) overrides[key] = null;
		goto(buildUrl(overrides), { keepFocus: true });
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
			const make = overrides.make !== undefined ? overrides.make : makeFilter || null;
			if (make) params.set('make', String(make));
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

	// select one of the mutually-exclusive make states; null = all
	function setMake(value: 'ready' | 'almost' | null) {
		goto(buildUrl({ make: value, page: 1 }), { keepFocus: true });
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
		<Callout class="mb-6">
			{#snippet icon()}<Mail class="h-5 w-5 text-primary" />{/snippet}
			{#snippet children()}
				<p class="sm:hidden">Sign up to save favorites</p>
				<p class="hidden sm:block">
					Sign up to <strong>save favorites</strong> and build your own bar.
				</p>
			{/snippet}
			{#snippet action()}
				<Button variant="cta-primary" size="cta-sm" href="/signup">Sign Up</Button>
			{/snippet}
		</Callout>
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
					<Button variant="primary" href="/catalog/add" size="sm" class="shrink-0">
						<Plus class="h-4 w-4 mr-1" />
						Add Recipe
					</Button>
				{/if}
			{/snippet}
		</SubNav>

		<!-- Hero Section -->
		<PageHero
			title="Catalog"
			subtitle="Browse cocktails and find what you can make with what's on hand."
		>
			<div class="flex gap-2 flex-wrap pb-1 -mb-1">
				<!-- make axis: all/ready/almost stat badges double as the mutually-exclusive filter control -->
				{#if makeableLensAvailable}
					{@render makeBadge(Wine, data.stackTotal, 'All', !makeFilter, () => setMake(null))}
					{@render makeBadge(
						Sparkles,
						data.readyCount,
						'Ready',
						makeFilter === 'ready',
						() => setMake('ready'),
						'text-neon-green-500'
					)}
					{#if data.almostThereCount > 0 || makeFilter === 'almost'}
						{@render makeBadge(
							GlassWater,
							data.almostThereCount,
							'Almost There',
							makeFilter === 'almost',
							() => setMake('almost'),
							'text-amber-500'
						)}
					{/if}
				{:else}
					<!-- global/public: no per-bar stock, so just the catalog size -->
					<StatBadge class="whitespace-nowrap">
						<Wine class="h-4 w-4 text-primary shrink-0" />
						<span class="text-sm font-bold">{data.pagination.total}</span>
						<span class="text-xs text-muted-foreground">Recipes</span>
					</StatBadge>
				{/if}

				{#if selectedSpirit && selectedSpirit !== 'all'}
					{@const spiritObj = data.spirits.find(
						(s) => String(s.recipeCategoryId) === selectedSpirit
					)}
					{#if spiritObj}
						<Badge size="lg" class="whitespace-nowrap">
							<span class="text-sm font-bold">{spiritObj.recipeCategoryDescription}</span>
							<span class="text-xs text-muted-foreground">Spirit</span>
						</Badge>
					{/if}
				{/if}

				{#if advancedFilterCount > 0}
					<Badge size="lg" as="button" onclick={clearAllAdvancedFilters} class="whitespace-nowrap">
						<SlidersHorizontal class="h-4 w-4 text-primary shrink-0" />
						<span class="text-sm font-bold">{advancedFilterCount}</span>
						<span class="text-xs text-muted-foreground"
							>Advanced Filter{advancedFilterCount !== 1 ? 's' : ''}</span
						>
						<X class="h-3 w-3 text-muted-foreground" />
					</Badge>
				{/if}
			</div>
		</PageHero>
	{:else}
		<!-- logged-out: hero hidden to create a curiosity gap around catalog size; keep a heading for seo/a11y -->
		<h1 class="sr-only">Cocktail Catalog</h1>
	{/if}

	<!-- make-filter badge: matches the inventory stat badges (single-line pill that wraps naturally);
	     the active/selected state reads as a pink-tinted primary badge. -->
	{#snippet makeBadge(
		Icon: typeof Wine,
		count: number,
		label: string,
		active: boolean,
		onSelect: () => void,
		iconClass = 'text-primary'
	)}
		<StatBadge
			as="button"
			variant={active ? 'primary' : 'default'}
			onclick={onSelect}
			aria-pressed={active}
			class="whitespace-nowrap"
		>
			<Icon class={cn('h-4 w-4 shrink-0', iconClass)} />
			<span class="text-sm font-bold">{count}</span>
			<span class="text-xs text-muted-foreground">{label}</span>
		</StatBadge>
	{/snippet}

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
							class="focus-ring absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
				advancedCount={advancedFilterCount}
				onDone={() => advancedApi?.apply()}
				onClear={clearSheetFilters}
			>
				{#snippet advanced(expanded)}
					<AdvancedSearchFields
						active={expanded}
						preparationMethods={data.preparationMethods}
						filters={data.filters}
						showActions={false}
						onRegister={(api) => (advancedApi = api)}
						onsearch={handleAdvancedSearch}
					/>
				{/snippet}
				<CatalogFilterPanel
					spirits={data.spirits}
					{selectedSpirit}
					{selectedMood}
					sortOption={selectedSort}
					{perPage}
					{advancedFilterCount}
					onSpiritChange={handleSpiritChange}
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

		<!-- show filter: stacked chip deck (moved out of the filter panel) -->
		<FilterChipDeck
			label="Show"
			options={showOptions}
			active={selectedShowFilter}
			activeLabel={showActiveLabel}
			onSelect={(id) => handleShowFilterChange(String(id))}
		/>
	</div>

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
				<Badge variant="danger" class="gap-1">
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
	{:else if data.recipes.length === 0 && makeableLensAvailable && makeFilter === 'ready' && !searchInput && advancedFilterCount === 0 && selectedShowFilter === 'all'}
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
					<Button variant="outline" onclick={() => setMake(null)}>Show all recipes</Button>
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
