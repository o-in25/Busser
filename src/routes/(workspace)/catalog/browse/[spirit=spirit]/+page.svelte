<script lang="ts">
	import { ChevronLeft, FlaskConical, Plus, Search, X } from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import CatalogBrowseCard from '$lib/components/CatalogBrowseCard.svelte';
	import CatalogFilterPanel from '$lib/components/CatalogFilterPanel.svelte';
	import FilterButton from '$lib/components/FilterButton.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
	import SpiritOverview from '$lib/components/SpiritOverview.svelte';
	import SpiritRegions from '$lib/components/SpiritRegions.svelte';
	import SpiritSources from '$lib/components/SpiritSources.svelte';
	import SpiritSubcategories from '$lib/components/SpiritSubcategories.svelte';
	import ViewToggle from '$lib/components/ViewToggle.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { idToSlug } from '$lib/spirits';
	import { reveal } from '$lib/reveal';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';
	import { cn } from '$lib/utils';

	import type { PageData } from './$types';
	import BackButton from '$lib/components/BackButton.svelte';

	let { data }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	// view mode
	let viewMode = $state<'grid' | 'list'>('grid');

	// filter state
	let searchInput = $state(data.filters.search ?? '');
	let selectedSort = $state(data.filters.sort ?? 'name-asc');

	// filter panel state
	let filterOpen = $state(false);

	// filter panel count (sort only, spirit is hidden)
	const activeFilterCount = $derived.by(() => {
		let count = 0;
		if (selectedSort !== 'name-asc') count++;
		return count;
	});

	// track favorites/featured for optimistic updates
	let favorites = $state(new Set(data.favoriteRecipeIds));
	let featured = $state(new Set(data.featuredRecipeIds));

	// sort options
	const sortOptions = [
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
	];

	// base path for this spirit's browse page
	const basePath = $derived(`/catalog/browse/${data.spiritContent.slug}`);

	const hex = $derived(data.spiritContent.accentColor.hex);

	// restore view mode from localStorage
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
		const pageNum = overrides.page !== undefined ? overrides.page : 1;

		params.set('page', String(pageNum));
		if (search) params.set('search', String(search));
		if (sort && sort !== 'name-asc') params.set('sort', String(sort));

		const queryString = params.toString();
		return queryString ? `${basePath}?${queryString}` : basePath;
	}

	function handleSearch(e: Event) {
		e.preventDefault();
		goto(buildUrl({ page: 1 }), { keepFocus: true });
	}

	function handleSortChange(value: string) {
		selectedSort = value;
		goto(buildUrl({ sort: value, page: 1 }), { keepFocus: true });
	}

	function clearSearch() {
		searchInput = '';
		goto(buildUrl({ search: '' }), { keepFocus: true });
	}

	function navigatePage(pageNum: number) {
		goto(buildUrl({ page: pageNum }));
	}

	function resetPanelFilters() {
		selectedSort = 'name-asc';
		goto(buildUrl({ sort: 'name-asc', page: 1 }), { keepFocus: true });
	}

	// update local state when page data changes
	$effect(() => {
		searchInput = data.filters.search ?? '';
		selectedSort = data.filters.sort ?? 'name-asc';
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
	<title>{data.spiritContent.displayName} - Spirit Guide</title>
</svelte:head>

<div class="container mx-auto px-4 mt-4 relative overflow-hidden">
	<!-- floating decorative orbs -->
	<div class="spirit-orb spirit-orb-1" style="background: {hex}"></div>
	<div class="spirit-orb spirit-orb-2" style="background: {hex}"></div>

	<div class="mb-4 mt-4 flex items-center justify-between">
		<BackButton
			href="/catalog/browse"
			label="Back to Catalog"
			size="sm"
			class="max-sm:[&>span]:hidden max-sm:gap-0"
		/>
	</div>
	<!-- Hero Section -->
	<div class="relative overflow-hidden rounded-xl mb-8">
		{#if data.spirit.recipeCategoryDescriptionImageUrl}
			<div class="absolute inset-0">
				<img
					src={data.spirit.recipeCategoryDescriptionImageUrl}
					alt={data.spiritContent.displayName}
					class="w-full h-full object-cover"
				/>
				<div
					class="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50"
				></div>
			</div>
		{:else}
			<div
				class="absolute inset-0 bg-gradient-to-br {data.spiritContent.accentColor.gradient}"
			></div>
		{/if}

		<div class="relative px-6 py-12 md:py-16">
			<h1 class="text-4xl md:text-5xl font-bold mb-3">
				{data.spiritContent.displayName}
			</h1>

			<p class="text-muted-foreground max-w-2xl text-lg">
				{data.spiritContent.overview.intro}
			</p>
		</div>
	</div>

	<!-- Spirit nav badges -->
	<div class="flex flex-wrap gap-2 mb-10">
		{#each data.spirits as spirit}
			{@const slug = idToSlug[spirit.recipeCategoryId]}
			{#if slug}
				<a href="/catalog/browse/{slug}">
					<Badge
						variant={spirit.recipeCategoryId === data.spirit.recipeCategoryId
							? 'default'
							: 'outline'}
						class="cursor-pointer hover:bg-accent transition-colors"
					>
						{spirit.recipeCategoryDescription}
					</Badge>
				</a>
			{/if}
		{/each}
	</div>

	<!-- History & Overview -->
	<div class="reveal-on-scroll" use:reveal>
		<SpiritOverview
			overview={data.spiritContent.overview}
			funFact={data.spiritContent.funFact}
			accentColor={data.spiritContent.accentColor}
		/>
	</div>

	<!-- gradient divider -->
	<div
		class="h-px my-4 mx-auto max-w-md"
		style="background: linear-gradient(90deg, transparent, {hex}40, transparent)"
	></div>

	<!-- Subcategories -->
	<div class="reveal-on-scroll" use:reveal={{ delay: 100 }}>
		<SpiritSubcategories
			subcategories={data.spiritContent.subcategories}
			accentColor={data.spiritContent.accentColor}
		/>
	</div>

	<!-- gradient divider -->
	<div
		class="h-px my-4 mx-auto max-w-md"
		style="background: linear-gradient(90deg, transparent, {hex}40, transparent)"
	></div>

	<!-- Geographic Origins -->
	<div class="reveal-on-scroll" use:reveal={{ delay: 200 }}>
		<SpiritRegions
			regions={data.spiritContent.regions}
			accentColor={data.spiritContent.accentColor}
		/>
	</div>

	<!-- gradient divider -->
	<div
		class="h-px my-4 mx-auto max-w-md"
		style="background: linear-gradient(90deg, transparent, {hex}40, transparent)"
	></div>

	<!-- Recipe Browsing Section -->
	<section class="mb-12">
		<h2 class="text-2xl font-bold mb-6">
			{data.spiritContent.displayName} Cocktails
		</h2>

		<!-- Toolbar -->
		<div class="flex flex-col gap-3 mb-6">
			<div class="flex items-center gap-2">
				<!-- Search -->
				<form onsubmit={handleSearch} class="flex-1 min-w-0">
					<div class="relative">
						<Search
							class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
						/>
						<Input
							type="text"
							placeholder="Search {data.spiritContent.displayName.toLowerCase()} recipes..."
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
					viewModes={['grid', 'list']}
					activeView={viewMode}
					onViewChange={setViewMode}
					onRefresh={invalidateAll}
				>
					<CatalogFilterPanel
						spirits={data.spirits}
						selectedSpirit={String(data.spirit.recipeCategoryId)}
						selectedShowFilter="all"
						sortOption={selectedSort}
						hideSpirit={true}
						onSpiritChange={() => {}}
						onShowFilterChange={() => {}}
						onSortChange={handleSortChange}
						onReset={resetPanelFilters}
					/>
				</FilterButton>

				<!-- View toggle -->
				<ViewToggle modes={['grid', 'list']} active={viewMode} onchange={setViewMode} />

				<!-- Add Recipe -->
				{#if canModify}
					<a
						href="/catalog/add"
						class={cn(buttonVariants(), 'shrink-0 w-10 px-0 sm:w-auto sm:px-4')}
					>
						<Plus class="h-4 w-4 sm:mr-2" />
						<span class="hidden sm:inline">Add Recipe</span>
					</a>
				{/if}
			</div>
		</div>

		<!-- Results count -->
		<p class="text-sm text-muted-foreground mb-4">
			{#if searchInput}
				Showing {data.recipes.length} of {data.pagination.total} recipes matching "{searchInput}"
			{:else}
				Showing {data.recipes.length} of {data.pagination.total}
				{data.pagination.total === 1 ? 'recipe' : 'recipes'}
			{/if}
		</p>

		<!-- Results -->
		{#if data.recipes.length === 0}
			<Card.Root class="border-dashed">
				<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
					<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
						<FlaskConical class="h-10 w-10 text-muted-foreground/50" />
					</div>
					<h3 class="text-xl font-semibold mb-2">
						{#if searchInput}
							No Recipes Found
						{:else}
							No {data.spiritContent.displayName} Recipes
						{/if}
					</h3>
					<p class="text-muted-foreground mb-6 max-w-md">
						{#if searchInput}
							No recipes match your search. Try adjusting your search terms.
						{:else}
							You haven't added any {data.spiritContent.displayName.toLowerCase()} cocktails yet.
						{/if}
					</p>
					{#if searchInput}
						<Button variant="outline" onclick={clearSearch}>Clear Search</Button>
					{:else if canModify}
						<a href="/catalog/add" class={buttonVariants()}>Add Recipe</a>
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
	</section>

	<!-- Sources -->
	<div class="reveal-on-scroll" use:reveal={{ delay: 300 }}>
		<SpiritSources sources={data.spiritContent.sources} />
	</div>
</div>

<style>
	.spirit-orb {
		position: absolute;
		width: 20rem;
		height: 20rem;
		border-radius: 9999px;
		opacity: 0.08;
		filter: blur(64px);
		pointer-events: none;
		z-index: 0;
	}

	.spirit-orb-1 {
		top: 15%;
		right: -5%;
		animation: spirit-float-1 12s ease-in-out infinite;
	}

	.spirit-orb-2 {
		bottom: 20%;
		left: -8%;
		animation: spirit-float-2 16s ease-in-out infinite;
	}

	@keyframes spirit-float-1 {
		0%,
		100% {
			transform: translate(0, 0);
		}
		33% {
			transform: translate(30px, -20px);
		}
		66% {
			transform: translate(-20px, 15px);
		}
	}

	@keyframes spirit-float-2 {
		0%,
		100% {
			transform: translate(0, 0);
		}
		33% {
			transform: translate(-25px, 20px);
		}
		66% {
			transform: translate(15px, -25px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spirit-orb {
			animation: none !important;
		}
	}
</style>
