<script lang="ts">
	import {
		ChevronLeft,
		ChevronRight,
		Layers,
		List,
		Package,
		Pencil,
		Plus,
		Search,
		TableIcon,
		Tags,
		Trash2,
		X,
	} from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';

	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import CategoryDetailDrawer from '$lib/components/CategoryDetailDrawer.svelte';
	import InventoryNav from '$lib/components/InventoryNav.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import * as Table from '$lib/components/ui/table';
	import type { Category } from '$lib/types';
	import { cn } from '$lib/utils';

	import { notificationStore } from '../../../../stores';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Drawer state
	let drawerOpen = $state(false);
	let selectedCategory = $state<Category | null>(null);

	function openDrawer(category: Category) {
		selectedCategory = category;
		drawerOpen = true;
	}

	function handleProductDeleted() {
		drawerOpen = false;
		invalidateAll();
	}

	// get workspace role for permission checks
	const workspace = getContext<{ workspaceRole?: string }>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';
	const basePath = '/inventory/category';

	// Search state
	let searchInput = $state(data.filters?.search || '');

	// Delete dialog state
	let deleteDialogOpen = $state(false);
	let categoryToDelete = $state<{ id: number; name: string } | null>(null);
	let isDeleting = $state(false);

	// View mode state
	let viewMode = $state<'table' | 'list'>('table');

	onMount(() => {
		const saved = localStorage.getItem('category-view-mode');
		if (saved === 'list' || saved === 'table') viewMode = saved;
	});

	function setViewMode(mode: 'table' | 'list') {
		viewMode = mode;
		if (browser) localStorage.setItem('category-view-mode', mode);
	}

	// Group filter state
	let activeGroup = $state<string | null>(null);

	// Derived: unique category groups with counts
	const categoryGroups = $derived.by(() => {
		const groups = new Map<string, number>();
		for (const cat of data.categories) {
			const group = cat.categoryGroupName;
			if (group) {
				groups.set(group, (groups.get(group) || 0) + 1);
			}
		}
		return [...groups.entries()].map(([name, count]) => ({ name, count }));
	});

	// Derived: filtered categories based on active group
	const filteredCategories = $derived.by(() => {
		if (!activeGroup) return data.categories;
		return data.categories.filter((c) => c.categoryGroupName === activeGroup);
	});

	// Update search input and reset group filter when data changes (SSR navigation)
	$effect(() => {
		searchInput = data.filters?.search || '';
		activeGroup = null;
	});

	const perPageOptions = [10, 25, 50, 100];

	// Build URL with current filters
	function buildUrl(overrides: Record<string, string | number | null> = {}) {
		const params = new URLSearchParams();
		const search = overrides.search !== undefined ? overrides.search : searchInput;
		const pageNum = overrides.page !== undefined ? overrides.page : 1;
		const perPage =
			overrides.perPage !== undefined ? overrides.perPage : data.filters?.perPage ?? 50;

		params.set('page', String(pageNum));
		if (search) params.set('search', String(search));
		if (perPage && Number(perPage) !== 50) params.set('perPage', String(perPage));

		return `${basePath}?${params.toString()}`;
	}

	// Handle search submit
	function handleSearch(e: Event) {
		e.preventDefault();
		goto(buildUrl({ page: 1 }), { keepFocus: true });
	}

	// Clear search
	function clearSearch() {
		searchInput = '';
		goto(buildUrl({ search: '', page: 1 }), { keepFocus: true });
	}

	// Pagination navigation
	function navigatePage(pageNum: number) {
		goto(buildUrl({ page: pageNum }));
	}

	// Generate page numbers
	const pages = $derived.by(() => {
		const { total, perPage, currentPage } = data.pagination;
		const totalPages = Math.ceil(total / perPage);
		return Array.from({ length: totalPages }, (_, i) => ({
			number: i + 1,
			active: i + 1 === currentPage,
		}));
	});

	// Delete handlers
	function openDeleteDialog(id: number, name: string) {
		categoryToDelete = { id, name };
		deleteDialogOpen = true;
	}

	function closeDeleteDialog() {
		deleteDialogOpen = false;
		categoryToDelete = null;
	}
</script>

<svelte:head>
	<title>Manage Categories - Inventory</title>
</svelte:head>

<!-- Inventory Section Navigation -->
<InventoryNav />

<!-- Hero Section -->
<div
	class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-8 mt-4"
>
	<div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
	<div class="relative px-6 py-8 md:py-10">
		<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
			<div>
				<h1 class="text-3xl md:text-4xl font-bold mb-2">Categories</h1>
				<p class="text-muted-foreground">
					Organize your inventory with categories and groups.
				</p>
			</div>

			{#if canModify}
				<a href="/inventory/category/add" class={cn(buttonVariants(), 'shrink-0')}>
					<Plus class="h-4 w-4 mr-2" />
					Add Category
				</a>
			{/if}
		</div>

		<!-- Stat Cards -->
		<div class="grid grid-cols-3 gap-2 md:gap-3 mt-6">
			<div
				class="flex flex-col items-center gap-2 py-3 md:flex-row md:gap-3 md:px-4 md:py-2 rounded-lg bg-background/80 backdrop-blur-sm border"
			>
				<div class="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 shrink-0">
					<Tags class="h-4 w-4 md:h-5 md:w-5 text-primary" />
				</div>
				<div class="text-center md:text-left">
					<p class="text-lg md:text-xl font-bold">{data.pagination.total}</p>
					<p class="text-[10px] md:text-xs text-muted-foreground">Categories</p>
				</div>
			</div>

			<div
				class="flex flex-col items-center gap-2 py-3 md:flex-row md:gap-3 md:px-4 md:py-2 rounded-lg bg-background/80 backdrop-blur-sm border"
			>
				<div class="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 shrink-0">
					<Package class="h-4 w-4 md:h-5 md:w-5 text-primary" />
				</div>
				<div class="text-center md:text-left">
					<p class="text-lg md:text-xl font-bold">{data.totalProducts}</p>
					<p class="text-[10px] md:text-xs text-muted-foreground">Products</p>
				</div>
			</div>

			<div
				class="flex flex-col items-center gap-2 py-3 md:flex-row md:gap-3 md:px-4 md:py-2 rounded-lg bg-background/80 backdrop-blur-sm border"
			>
				<div class="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary/10 shrink-0">
					<Layers class="h-4 w-4 md:h-5 md:w-5 text-primary" />
				</div>
				<div class="text-center md:text-left">
					<p class="text-lg md:text-xl font-bold">{categoryGroups.length}</p>
					<p class="text-[10px] md:text-xs text-muted-foreground">Groups</p>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Search Bar & Filters -->
<div class="flex flex-col sm:flex-row gap-3 mb-6">
	<form onsubmit={handleSearch} class="flex gap-2 flex-1">
		<div class="relative flex-1 max-w-sm">
			<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search categories..."
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
		<Button type="submit" variant="outline">Search</Button>
	</form>

	<Select.Root
		type="single"
		value={String(data.pagination.perPage)}
		onValueChange={(v) => {
			if (v) goto(buildUrl({ perPage: Number(v), page: 1 }));
		}}
	>
		<Select.Trigger class="w-full sm:w-[180px]">
			<Package class="h-4 w-4 mr-2" />
			<Select.Value placeholder="50 per page">{data.pagination.perPage} per page</Select.Value>
		</Select.Trigger>
		<Select.Content>
			{#each perPageOptions as opt}
				<Select.Item value={String(opt)} label="{opt} per page" />
			{/each}
		</Select.Content>
	</Select.Root>

	<!-- View Toggle -->
	<div class="flex items-center border border-input/50 rounded-lg overflow-hidden shrink-0 w-fit">
		<button
			class={cn(
				'h-10 w-10 flex items-center justify-center transition-colors',
				viewMode === 'table' ? 'bg-accent text-primary-foreground' : 'hover:bg-muted'
			)}
			onclick={() => setViewMode('table')}
			aria-label="Table view"
		>
			<TableIcon class="h-4 w-4" />
		</button>
		<button
			class={cn(
				'h-10 w-10 flex items-center justify-center transition-colors',
				viewMode === 'list' ? 'bg-accent text-primary-foreground' : 'hover:bg-muted'
			)}
			onclick={() => setViewMode('list')}
			aria-label="List view"
		>
			<List class="h-4 w-4" />
		</button>
	</div>
</div>

<!-- Results info -->
{#if data.filters?.search}
	<p class="text-sm text-muted-foreground mb-4">
		Showing results for "<span class="font-medium">{data.filters.search}</span>"
	</p>
{/if}

<!-- Group Filter Chips -->
{#if categoryGroups.length >= 2}
	<div class="flex flex-wrap gap-2 mb-6">
		<Button
			variant={activeGroup === null ? 'default' : 'outline'}
			class="rounded-full"
			size="sm"
			onclick={() => (activeGroup = null)}
		>
			All ({data.categories.length})
		</Button>
		{#each categoryGroups as group}
			<Button
				variant={activeGroup === group.name ? 'default' : 'outline'}
				class="rounded-full"
				size="sm"
				onclick={() => (activeGroup = group.name)}
			>
				{group.name} ({group.count})
			</Button>
		{/each}
	</div>
{/if}

<!-- Results Count -->
<div class="flex items-center justify-between mb-4">
	<p class="text-sm text-muted-foreground">
		Showing {filteredCategories.length} of {data.pagination.total} categories
	</p>
</div>

<!-- Categories Table -->
{#if data.categories.length === 0}
	<Card.Root class="border-dashed">
		<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
			<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
				<Tags class="h-10 w-10 text-muted-foreground/50" />
			</div>
			<h3 class="text-xl font-semibold mb-2">
				{#if data.filters?.search}
					No Categories Found
				{:else}
					No Categories Yet
				{/if}
			</h3>
			<p class="text-muted-foreground mb-6 max-w-md">
				{#if data.filters?.search}
					No categories match your search. Try a different term or clear the search.
				{:else}
					Categories help you organize your inventory. Create your first category to get started.
				{/if}
			</p>
			<div class="flex gap-3">
				{#if data.filters?.search}
					<Button variant="outline" onclick={clearSearch}>Clear Search</Button>
				{/if}
				{#if canModify}
					<a href="/inventory/category/add" class={buttonVariants()}>
						<Plus class="h-4 w-4 mr-2" />
						Add Category
					</a>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
{:else if filteredCategories.length === 0}
	<!-- Empty state for group filter -->
	<Card.Root class="border-dashed">
		<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
			<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
				<Layers class="h-10 w-10 text-muted-foreground/50" />
			</div>
			<h3 class="text-xl font-semibold mb-2">No Categories in This Group</h3>
			<p class="text-muted-foreground mb-6 max-w-md">
				No categories match the selected group filter.
			</p>
			<Button variant="outline" onclick={() => (activeGroup = null)}>Show All Categories</Button>
		</Card.Content>
	</Card.Root>
{:else if viewMode === 'table'}
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between">
				<div>
					<Card.Title class="flex items-center gap-2">
						<Tags class="h-5 w-5" />
						Categories
					</Card.Title>
					<Card.Description>
						{#if activeGroup}
							Showing {filteredCategories.length} categor{filteredCategories.length === 1
								? 'y'
								: 'ies'} in "{activeGroup}"
						{:else}
							{filteredCategories.length} categor{filteredCategories.length === 1
								? 'y'
								: 'ies'} total
						{/if}
					</Card.Description>
				</div>
				<Badge variant="secondary" class="text-sm">
					{filteredCategories.length}
				</Badge>
			</div>
		</Card.Header>
		<Card.Content class="p-0">
			<div class="overflow-x-auto">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head class="pl-6">Name</Table.Head>
							<Table.Head class="hidden sm:table-cell">Group</Table.Head>
							<Table.Head>Description</Table.Head>
							<Table.Head class="text-center">Products</Table.Head>
							{#if canModify}
								<Table.Head class="text-right pr-6">Actions</Table.Head>
							{/if}
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each filteredCategories as category (category.categoryId)}
							<Table.Row class="cursor-pointer" onclick={() => openDrawer(category)}>
								<Table.Cell class="font-medium pl-6">{category.categoryName}</Table.Cell>
								<Table.Cell class="hidden sm:table-cell">
									{#if category.categoryGroupName}
										<Badge variant="outline">{category.categoryGroupName}</Badge>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-muted-foreground max-w-md truncate">
									{category.categoryDescription || '—'}
								</Table.Cell>
								<Table.Cell class="text-center">
									<span
										class="inline-flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium"
									>
										{category.productCount}
									</span>
								</Table.Cell>
								{#if canModify}
									<Table.Cell class="text-right pr-6">
										<!-- svelte-ignore a11y_click_events_have_key_events -->
										<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
										<div
											class="flex items-center justify-end gap-2"
											role="group"
											onclick={(e) => e.stopPropagation()}
										>
											<a
												href="/inventory/category/{category.categoryId}/edit"
												class={cn(
													buttonVariants({ variant: 'outline', size: 'icon' }),
													'h-8 w-8 bg-violet-500/20 border-violet-500/50 text-violet-400 hover:bg-violet-500 hover:text-white'
												)}
												title="Edit category"
											>
												<Pencil class="w-4 h-4" />
											</a>
											<Button
												variant="outline"
												size="icon"
												class="h-8 w-8 bg-destructive/20 border-destructive/50 text-red-400 hover:bg-destructive hover:text-destructive-foreground"
												onclick={() =>
													openDeleteDialog(category.categoryId, category.categoryName)}
												title="Delete category"
												disabled={category.productCount > 0}
											>
												<Trash2 class="w-4 h-4" />
											</Button>
										</div>
									</Table.Cell>
								{/if}
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		</Card.Content>
	</Card.Root>
{:else}
	<!-- List View -->
	<div class="flex flex-col gap-3">
		{#each filteredCategories as category (category.categoryId)}
			<button
				class="w-full text-left"
				onclick={() => openDrawer(category)}
			>
				<Card.Root class="hover:border-primary/30 transition-colors">
					<Card.Content class="p-4">
						<div class="flex items-start justify-between gap-3">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-1">
									<h3 class="font-medium truncate">{category.categoryName}</h3>
									{#if category.categoryGroupName}
										<Badge variant="outline" class="shrink-0">{category.categoryGroupName}</Badge>
									{/if}
								</div>
								{#if category.categoryDescription}
									<p class="text-sm text-muted-foreground line-clamp-2">
										{category.categoryDescription}
									</p>
								{/if}
							</div>
							<div class="flex items-center gap-2 shrink-0">
								<span
									class="inline-flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-sm font-medium"
								>
									{category.productCount} {category.productCount === 1 ? 'product' : 'products'}
								</span>
								{#if canModify}
									<!-- svelte-ignore a11y_click_events_have_key_events -->
									<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
									<div
										class="flex items-center gap-1"
										role="group"
										onclick={(e) => e.stopPropagation()}
									>
										<a
											href="/inventory/category/{category.categoryId}/edit"
											class={cn(
												buttonVariants({ variant: 'outline', size: 'icon' }),
												'h-8 w-8 bg-violet-500/20 border-violet-500/50 text-violet-400 hover:bg-violet-500 hover:text-white'
											)}
											title="Edit category"
										>
											<Pencil class="w-4 h-4" />
										</a>
										<Button
											variant="outline"
											size="icon"
											class="h-8 w-8 bg-destructive/20 border-destructive/50 text-red-400 hover:bg-destructive hover:text-destructive-foreground"
											onclick={() =>
												openDeleteDialog(category.categoryId, category.categoryName)}
											title="Delete category"
											disabled={category.productCount > 0}
										>
											<Trash2 class="w-4 h-4" />
										</Button>
									</div>
								{/if}
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</button>
		{/each}
	</div>
{/if}

{#if data.categories.length > 0 && filteredCategories.length > 0}
	<!-- Pagination -->
	<div class="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
		<div class="text-sm text-muted-foreground">
			<span class="font-semibold">{data.pagination.total}</span>
			{data.pagination.total === 1 ? 'category' : 'categories'} total
		</div>

		{#if data.pagination.total > data.pagination.perPage}
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground">
					Page {data.pagination.currentPage}
					of {Math.ceil(data.pagination.total / data.pagination.perPage)}
				</span>
				<nav class="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						class="h-8 w-8"
						onclick={() => navigatePage(data.pagination.prevPage || data.pagination.currentPage)}
						disabled={!data.pagination.prevPage}
					>
						<span class="sr-only">Previous</span>
						<ChevronLeft class="w-4 h-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						class="h-8 w-8"
						onclick={() => navigatePage(data.pagination.nextPage || data.pagination.currentPage)}
						disabled={!data.pagination.nextPage}
					>
						<span class="sr-only">Next</span>
						<ChevronRight class="w-4 h-4" />
					</Button>
				</nav>
			</div>
		{/if}
	</div>
{/if}

<!-- Category Detail Drawer -->
<CategoryDetailDrawer
	bind:open={drawerOpen}
	category={selectedCategory}
	{canModify}
	onProductDeleted={handleProductDeleted}
/>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Category</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete "{categoryToDelete?.name}"? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={closeDeleteDialog} disabled={isDeleting}>Cancel</Button>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					isDeleting = true;
					return async ({ result }) => {
						isDeleting = false;
						if (result.type === 'success') {
							closeDeleteDialog();
							$notificationStore.success = { message: 'Category deleted successfully.' };
							await invalidateAll();
						} else if (result.type === 'failure') {
							$notificationStore.error = {
								message: result.data?.error?.toString() || 'Failed to delete category.',
							};
						}
					};
				}}
			>
				<input type="hidden" name="categoryId" value={categoryToDelete?.id} />
				<Button type="submit" variant="destructive" disabled={isDeleting}>
					{isDeleting ? 'Deleting...' : 'Delete'}
				</Button>
			</form>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	.bg-grid-pattern {
		background-image: radial-gradient(circle, currentColor 1px, transparent 1px);
		background-size: 24px 24px;
	}
</style>
