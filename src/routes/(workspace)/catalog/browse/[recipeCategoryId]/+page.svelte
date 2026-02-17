<script lang="ts">
	import {
		ArrowUpDown,
		ChevronLeft,
		FlaskConical,
		LayoutGrid,
		List,
		Plus,
		Search,
		X,
	} from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import CatalogBrowseCard from '$lib/components/CatalogBrowseCard.svelte';
	import Pagination from '$lib/components/Pagination.svelte';
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
	let searchInput = $state(data.filters.search ?? '');
	let selectedSort = $state(data.filters.sort ?? 'name-asc');

	// Track favorites/featured for optimistic updates
	let favorites = $state(new Set(data.favoriteRecipeIds));
	let featured = $state(new Set(data.featuredRecipeIds));

	// Sort options
	const sortOptions = [
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
	];

	// Base path for this spirit's browse page
	const basePath = `/catalog/browse/${data.spirit.recipeCategoryId}`;

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

	// Update local state when page data changes
	$effect(() => {
		searchInput = data.filters.search ?? '';
		selectedSort = data.filters.sort ?? 'name-asc';
		favorites = new Set(data.favoriteRecipeIds);
		featured = new Set(data.featuredRecipeIds);
	});

	// Compute display label for sort dropdown
	const sortLabel = $derived.by(() => {
		const option = sortOptions.find((o) => o.value === selectedSort);
		return option?.label || 'Name (A-Z)';
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
	<title>{data.spirit.recipeCategoryDescription} Cocktails - Catalog</title>
</svelte:head>

<div class="container mx-auto px-4 mt-4">
	<!-- Hero Section -->
	<div class="relative overflow-hidden rounded-xl mb-6">
		<!-- Background image -->
		{#if data.spirit.recipeCategoryDescriptionImageUrl}
			<div class="absolute inset-0">
				<img
					src={data.spirit.recipeCategoryDescriptionImageUrl}
					alt={data.spirit.recipeCategoryDescription}
					class="w-full h-full object-cover"
				/>
				<div
					class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40"
				></div>
			</div>
		{:else}
			<div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
		{/if}

		<!-- Content -->
		<div class="relative px-6 py-10">
			<a
				href="/catalog/browse"
				class={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-2 mb-4')}
			>
				<ChevronLeft class="h-4 w-4" />
				All Recipes
			</a>

			<h1 class="text-3xl md:text-4xl font-bold mb-2">
				{data.spirit.recipeCategoryDescription} Cocktails
			</h1>

			{#if data.spirit.recipeCategoryDescriptionText}
				<p class="text-muted-foreground max-w-2xl">
					{data.spirit.recipeCategoryDescriptionText}
				</p>
			{/if}
		</div>
	</div>

	<!-- Other category quick filters -->
	<div class="flex flex-wrap gap-2 mb-6">
		{#each data.spirits as spirit}
			<a href="/catalog/browse/{spirit.recipeCategoryId}">
				<Badge
					variant={spirit.recipeCategoryId === data.spirit.recipeCategoryId ? 'default' : 'outline'}
					class="cursor-pointer hover:bg-accent transition-colors"
				>
					{spirit.recipeCategoryDescription}
				</Badge>
			</a>
		{/each}
	</div>

	<!-- Toolbar -->
	<div class="flex flex-col gap-3 mb-6">
		<!-- Row 1: Search, Sort (+ action buttons on large screens) -->
		<div class="flex flex-col sm:flex-row gap-3 lg:items-center">
			<!-- Search -->
			<form onsubmit={handleSearch} class="flex-1">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search {data.spirit.recipeCategoryDescription?.toLowerCase()} recipes..."
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

			<!-- Sort Select -->
			<Select.Root
				type="single"
				value={selectedSort}
				onValueChange={(v) => handleSortChange(v ?? 'name-asc')}
			>
				<Select.Trigger class="w-full sm:w-[160px]">
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
						No {data.spirit.recipeCategoryDescription || 'Spirit'} Recipes
					{/if}
				</h3>
				<p class="text-muted-foreground mb-6 max-w-md">
					{#if searchInput}
						No recipes match your search. Try adjusting your search terms.
					{:else}
						You haven't added any {(
							data.spirit.recipeCategoryDescription || 'spirit'
						).toLowerCase()} cocktails yet.
					{/if}
				</p>
				{#if searchInput}
					<Button variant="outline" onclick={clearSearch}>Clear Search</Button>
				{:else if canModify}
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
		<Pagination
			pagination={data.pagination}
			itemLabel="recipes"
			onNavigate={navigatePage}
		/>
	{/if}
</div>
