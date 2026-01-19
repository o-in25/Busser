<script lang="ts">
	import type { PageData } from './$types';
	import type { View } from '$lib/types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import CatalogBrowseCard from '$lib/components/CatalogBrowseCard.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { cn } from '$lib/utils';
	import {
		Search,
		Plus,
		X,
		LayoutGrid,
		List,
		SlidersHorizontal,
		FlaskConical,
		GlassWater,
		ArrowUpDown,
		Loader2,
		CheckCircle2,
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getContext, onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { data }: { data: PageData } = $props();

	const permissions: string[] = getContext('permissions') || [];

	// Local state
	let recipes = $state<View.BasicRecipe[]>(data.recipes);
	let searchInput = $state(data.filters.search);
	let selectedSpirit = $state(data.filters.spirit);
	let availableOnly = $state(data.filters.available);
	let sortOption = $state(data.filters.sort);
	let viewMode = $state<'grid' | 'list'>('grid');
	let currentPage = $state(data.filters.page);
	let hasMore = $state(data.pagination.currentPage < data.pagination.lastPage);
	let isLoading = $state(false);
	let loadMoreRef: HTMLDivElement;

	// Restore view mode from localStorage
	onMount(() => {
		const savedViewMode = localStorage.getItem('catalog-view-mode');
		if (savedViewMode === 'list' || savedViewMode === 'grid') {
			viewMode = savedViewMode;
		}
	});

	// Save view mode preference
	function setViewMode(mode: 'grid' | 'list') {
		viewMode = mode;
		if (browser) {
			localStorage.setItem('catalog-view-mode', mode);
		}
	}

	// Build URL with current filters
	function buildUrl(overrides: Record<string, string | boolean | number | null> = {}) {
		const params = new URLSearchParams();

		const search = overrides.search !== undefined ? overrides.search : searchInput;
		const spirit = overrides.spirit !== undefined ? overrides.spirit : selectedSpirit;
		const available = overrides.available !== undefined ? overrides.available : availableOnly;
		const sort = overrides.sort !== undefined ? overrides.sort : sortOption;

		if (search) params.set('search', String(search));
		if (spirit) params.set('spirit', String(spirit));
		if (available) params.set('available', 'true');
		if (sort && sort !== 'name-asc') params.set('sort', String(sort));

		const queryString = params.toString();
		return queryString ? `/catalog/browse?${queryString}` : '/catalog/browse';
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

	// Handle spirit filter click
	function handleSpiritFilter(spiritId: string) {
		selectedSpirit = spiritId === selectedSpirit ? '' : spiritId;
		goto(buildUrl({ spirit: selectedSpirit }), { keepFocus: true });
	}

	// Handle available toggle
	function handleAvailableToggle() {
		availableOnly = !availableOnly;
		goto(buildUrl({ available: availableOnly }), { keepFocus: true });
	}

	// Handle sort change
	function handleSortChange(value: string) {
		sortOption = value;
		goto(buildUrl({ sort: value }), { keepFocus: true });
	}

	// Clear all filters
	function clearFilters() {
		searchInput = '';
		selectedSpirit = '';
		availableOnly = false;
		sortOption = 'name-asc';
		goto('/catalog/browse');
	}

	// Clear search only
	function clearSearch() {
		searchInput = '';
		goto(buildUrl({ search: '' }), { keepFocus: true });
	}

	// Load more recipes
	async function loadMore() {
		if (isLoading || !hasMore) return;

		isLoading = true;
		const nextPage = currentPage + 1;

		try {
			const params = new URLSearchParams();
			params.set('page', String(nextPage));
			params.set('perPage', '24');
			if (searchInput) params.set('search', searchInput);
			if (selectedSpirit) params.set('spirit', selectedSpirit);
			if (availableOnly) params.set('available', 'true');
			params.set('sort', sortOption);

			const response = await fetch(`/api/catalog/browse?${params.toString()}`);
			const result = await response.json();

			recipes = [...recipes, ...result.recipes];
			currentPage = nextPage;
			hasMore = result.pagination.currentPage < result.pagination.lastPage;
		} catch (error) {
			console.error('Failed to load more recipes:', error);
		} finally {
			isLoading = false;
		}
	}

	// Intersection Observer for infinite scroll
	onMount(() => {
		if (!browser || !loadMoreRef) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && hasMore && !isLoading) {
					loadMore();
				}
			},
			{ rootMargin: '200px' }
		);

		observer.observe(loadMoreRef);

		return () => observer.disconnect();
	});

	// Check if any filters are active
	let hasActiveFilters = $derived(
		searchInput || selectedSpirit || availableOnly || sortOption !== 'name-asc'
	);

	// Sort options for select
	const sortOptions = [
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
	];

	// Update local state when page data changes (for SSR navigation)
	$effect(() => {
		recipes = data.recipes;
		searchInput = data.filters.search;
		selectedSpirit = data.filters.spirit;
		availableOnly = data.filters.available;
		sortOption = data.filters.sort;
		currentPage = data.filters.page;
		hasMore = data.pagination.currentPage < data.pagination.lastPage;
	});
</script>

<svelte:head>
	<title>Browse Catalog - Busser</title>
</svelte:head>

<Breadcrumb name="Catalog" href="/catalog">
	<BreadcrumbItem name="Browse" />
</Breadcrumb>

<!-- Header Section -->
<div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-8 mt-4">
	<div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
	<div class="relative px-6 py-8 md:py-10">
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div>
				<h1 class="text-3xl md:text-4xl font-bold mb-2">Browse Catalog</h1>
				<p class="text-muted-foreground">
					Discover and explore all {data.totalRecipes} cocktail recipes in your collection.
				</p>
			</div>

			<!-- Quick Stats -->
			<div class="flex gap-3">
				<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border">
					<FlaskConical class="h-5 w-5 text-primary" />
					<div>
						<p class="text-xl font-bold">{data.totalRecipes}</p>
						<p class="text-xs text-muted-foreground">Recipes</p>
					</div>
				</div>
				<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border">
					<GlassWater class="h-5 w-5 text-primary" />
					<div>
						<p class="text-xl font-bold">{data.spirits.length}</p>
						<p class="text-xs text-muted-foreground">Spirits</p>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Spirit Filter Chips -->
<div class="mb-6">
	<div class="flex items-center gap-2 mb-3">
		<SlidersHorizontal class="h-4 w-4 text-muted-foreground" />
		<span class="text-sm font-medium text-muted-foreground">Filter by Spirit</span>
	</div>
	<div class="flex flex-wrap gap-2">
		<button
			class={cn(
				"px-4 py-2 rounded-full text-sm font-medium transition-all",
				!selectedSpirit
					? "bg-primary text-primary-foreground"
					: "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
			)}
			onclick={() => handleSpiritFilter('')}
		>
			All Spirits
		</button>
		{#each data.spirits as spirit}
			<button
				class={cn(
					"px-4 py-2 rounded-full text-sm font-medium transition-all",
					selectedSpirit === String(spirit.recipeCategoryId)
						? "bg-primary text-primary-foreground"
						: "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
				)}
				onclick={() => handleSpiritFilter(String(spirit.recipeCategoryId))}
			>
				{spirit.recipeCategoryDescription}
			</button>
		{/each}
	</div>
</div>

<!-- Toolbar -->
<div class="flex flex-col sm:flex-row gap-3 mb-6">
	<!-- Search -->
	<form onsubmit={handleSearch} class="flex-1">
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

	<div class="flex items-center gap-2">
		<!-- Available Toggle -->
		<div class="flex items-center gap-2 px-3 py-2 rounded-md border bg-background">
			<Switch
				id="available-toggle"
				checked={availableOnly}
				onCheckedChange={handleAvailableToggle}
			/>
			<Label for="available-toggle" class="text-sm cursor-pointer flex items-center gap-1.5">
				<CheckCircle2 class="h-4 w-4 text-green-500" />
				<span class="hidden sm:inline">Available</span>
			</Label>
		</div>

		<!-- Sort Select -->
		<Select.Root
			type="single"
			value={sortOption}
			onValueChange={(v) => handleSortChange(v)}
		>
			<Select.Trigger class="w-[160px]">
				<ArrowUpDown class="h-4 w-4 mr-2" />
				<Select.Value placeholder="Sort by" />
			</Select.Trigger>
			<Select.Content>
				{#each sortOptions as option}
					<Select.Item value={option.value}>{option.label}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>

		<!-- View Toggle -->
		<div class="flex items-center border rounded-md overflow-hidden">
			<button
				class={cn(
					"p-2 transition-colors",
					viewMode === 'grid' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
				)}
				onclick={() => setViewMode('grid')}
				aria-label="Grid view"
			>
				<LayoutGrid class="h-4 w-4" />
			</button>
			<button
				class={cn(
					"p-2 transition-colors",
					viewMode === 'list' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
				)}
				onclick={() => setViewMode('list')}
				aria-label="List view"
			>
				<List class="h-4 w-4" />
			</button>
		</div>

		<!-- Add Recipe Button -->
		{#if permissions.includes('add_catalog')}
			<a href="/catalog/add" class={cn(buttonVariants(), "shrink-0")}>
				<Plus class="h-4 w-4 sm:mr-2" />
				<span class="hidden sm:inline">Add Recipe</span>
			</a>
		{/if}
	</div>
</div>

<!-- Active Filters Display -->
{#if hasActiveFilters}
	<div class="flex flex-wrap items-center gap-2 mb-6">
		<span class="text-sm text-muted-foreground">Active filters:</span>
		{#if searchInput}
			<Badge variant="secondary" class="gap-1">
				Search: "{searchInput}"
				<button onclick={clearSearch} class="ml-1 hover:text-destructive">
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/if}
		{#if selectedSpirit}
			{@const spirit = data.spirits.find(s => String(s.recipeCategoryId) === selectedSpirit)}
			<Badge variant="secondary" class="gap-1">
				Spirit: {spirit?.recipeCategoryDescription || selectedSpirit}
				<button onclick={() => handleSpiritFilter('')} class="ml-1 hover:text-destructive">
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/if}
		{#if availableOnly}
			<Badge variant="secondary" class="gap-1">
				Available Only
				<button onclick={handleAvailableToggle} class="ml-1 hover:text-destructive">
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/if}
		{#if sortOption !== 'name-asc'}
			{@const sortLabel = sortOptions.find(s => s.value === sortOption)?.label}
			<Badge variant="secondary" class="gap-1">
				Sort: {sortLabel}
				<button onclick={() => handleSortChange('name-asc')} class="ml-1 hover:text-destructive">
					<X class="h-3 w-3" />
				</button>
			</Badge>
		{/if}
		<button
			onclick={clearFilters}
			class="text-sm text-muted-foreground hover:text-foreground underline"
		>
			Clear all
		</button>
	</div>
{/if}

<!-- Results Count -->
<div class="flex items-center justify-between mb-4">
	<p class="text-sm text-muted-foreground">
		Showing {recipes.length} of {data.pagination.total} recipes
	</p>
</div>

<!-- Recipe Grid/List -->
{#if recipes.length === 0}
	<!-- Empty State -->
	<Card.Root class="border-dashed">
		<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
			<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
				<Search class="h-10 w-10 text-muted-foreground/50" />
			</div>
			<h3 class="text-xl font-semibold mb-2">No Recipes Found</h3>
			<p class="text-muted-foreground mb-6 max-w-md">
				{#if hasActiveFilters}
					No recipes match your current filters. Try adjusting your search or clearing filters.
				{:else}
					Your catalog is empty. Start by adding your first recipe!
				{/if}
			</p>
			<div class="flex gap-3">
				{#if hasActiveFilters}
					<Button variant="outline" onclick={clearFilters}>
						Clear Filters
					</Button>
				{/if}
				{#if permissions.includes('add_catalog')}
					<a href="/catalog/add" class={buttonVariants()}>
						<Plus class="h-4 w-4 mr-2" />
						Add Recipe
					</a>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
{:else}
	<!-- Results -->
	<div class={cn(
		viewMode === 'grid'
			? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
			: "flex flex-col gap-3"
	)}>
		{#each recipes as recipe (recipe.recipeId)}
			<CatalogBrowseCard {recipe} {viewMode} />
		{/each}
	</div>

	<!-- Load More Section -->
	<div bind:this={loadMoreRef} class="mt-8">
		{#if isLoading}
			<!-- Loading State -->
			<div class="flex flex-col items-center justify-center py-8">
				<Loader2 class="h-8 w-8 animate-spin text-primary mb-3" />
				<p class="text-sm text-muted-foreground">Loading more recipes...</p>
			</div>
		{:else if hasMore}
			<!-- Load More Button (fallback for no JS intersection observer) -->
			<div class="flex justify-center">
				<Button variant="outline" size="lg" onclick={loadMore}>
					Load More Recipes
				</Button>
			</div>
		{:else if recipes.length > 0}
			<!-- End of Results -->
			<div class="flex flex-col items-center justify-center py-8 text-center">
				<CheckCircle2 class="h-8 w-8 text-green-500 mb-3" />
				<p class="text-muted-foreground">
					You've reached the end! Showing all {recipes.length} recipes.
				</p>
			</div>
		{/if}
	</div>
{/if}

<style>
	.bg-grid-pattern {
		background-image: radial-gradient(circle, currentColor 1px, transparent 1px);
		background-size: 24px 24px;
	}
</style>
