<script lang="ts">
	import {
		ChevronLeft,
		ChevronRight,
		FlaskConical,
		LayoutGrid,
		List,
		Search,
		X,
	} from 'lucide-svelte';
	import { onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import BackButton from '$lib/components/BackButton.svelte';
	import CatalogBrowseCard from '$lib/components/CatalogBrowseCard.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import { cn } from '$lib/utils';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// View mode
	let viewMode = $state<'grid' | 'list'>('grid');

	// Filter state
	let searchInput = $state(data.filters.search || '');
	let selectedSort = $state(data.filters.sort || 'name-asc');

	// Sort options
	const sortOptions = [
		{ value: 'name-asc', label: 'Name (A-Z)' },
		{ value: 'name-desc', label: 'Name (Z-A)' },
		{ value: 'newest', label: 'Newest First' },
		{ value: 'oldest', label: 'Oldest First' },
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
		const pageNum = overrides.page !== undefined ? overrides.page : 1;

		params.set('page', String(pageNum));
		if (search) params.set('search', String(search));
		if (sort && sort !== 'name-asc') params.set('sort', String(sort));

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

	function clearSearch() {
		searchInput = '';
		goto(buildUrl({ search: '' }), { keepFocus: true });
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
	});
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

	<!-- Spirit category quick filters -->
	<div class="flex flex-wrap gap-2 mb-6">
		{#each data.spirits as spirit}
			<a href="/catalog/browse/{spirit.recipeCategoryId}">
				<Badge variant="outline" class="cursor-pointer hover:bg-accent transition-colors">
					{spirit.recipeCategoryDescription}
				</Badge>
			</a>
		{/each}
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
			<!-- Sort Select -->
			<Select.Root
				type="single"
				value={selectedSort}
				onValueChange={(v) => handleSortChange(v ?? 'name-asc')}
			>
				<Select.Trigger class="w-[150px]">
					<Select.Value placeholder="Sort by" />
				</Select.Trigger>
				<Select.Content>
					{#each sortOptions as option}
						<Select.Item value={option.value} label={option.label} />
					{/each}
				</Select.Content>
			</Select.Root>

			<!-- View Toggle -->
			<div class="flex items-center border rounded-md overflow-hidden">
				<button
					class={cn(
						'p-2 transition-colors',
						viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
					)}
					onclick={() => setViewMode('grid')}
					aria-label="Grid view"
				>
					<LayoutGrid class="h-4 w-4" />
				</button>
				<button
					class={cn(
						'p-2 transition-colors',
						viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
					)}
					onclick={() => setViewMode('list')}
					aria-label="List view"
				>
					<List class="h-4 w-4" />
				</button>
			</div>
		</div>
	</div>

	<!-- Results -->
	{#if data.recipes.length === 0}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
				<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
					<FlaskConical class="h-10 w-10 text-muted-foreground/50" />
				</div>
				<h3 class="text-xl font-semibold mb-2">No Recipes Found</h3>
				<p class="text-muted-foreground mb-6 max-w-md">
					{#if searchInput}
						No recipes match your search. Try adjusting your search terms.
					{:else}
						Your catalog is empty. Start by adding your first recipe!
					{/if}
				</p>
				{#if searchInput}
					<Button variant="outline" onclick={clearSearch}>Clear Search</Button>
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
				<CatalogBrowseCard {recipe} {viewMode} />
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
