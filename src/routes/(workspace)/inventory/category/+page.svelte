<script lang="ts">
	import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Tags, Trash2, X } from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import CategoryDetailDrawer from '$lib/components/CategoryDetailDrawer.svelte';
	import InventoryNav from '$lib/components/InventoryNav.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
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

	// Update search input when data changes (SSR navigation)
	$effect(() => {
		searchInput = data.filters?.search || '';
	});

	// Build URL with current filters
	function buildUrl(overrides: Record<string, string | number | null> = {}) {
		const params = new URLSearchParams();
		const search = overrides.search !== undefined ? overrides.search : searchInput;
		const pageNum = overrides.page !== undefined ? overrides.page : 1;

		params.set('page', String(pageNum));
		if (search) params.set('search', String(search));

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

<div class="container mx-auto max-w-4xl">
	<!-- Header -->
	<div class="flex items-center justify-between gap-4 mb-6">
		<div>
			<h1 class="text-2xl font-bold">Categories</h1>
			<p class="text-muted-foreground">Organize your inventory with categories</p>
		</div>
		{#if canModify}
			<a href="/inventory/category/add" class={cn(buttonVariants())}>
				<Plus class="h-4 w-4 mr-2" />
				Add Category
			</a>
		{/if}
	</div>

	<!-- Search Bar -->
	<div class="mb-6">
		<form onsubmit={handleSearch} class="flex gap-2">
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
	</div>

	<!-- Results info -->
	{#if data.filters?.search}
		<p class="text-sm text-muted-foreground mb-4">
			Showing results for "<span class="font-medium">{data.filters.search}</span>"
		</p>
	{/if}

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
	{:else}
		<Card.Root>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head class="hidden sm:table-cell">Group</Table.Head>
						<Table.Head>Description</Table.Head>
						<Table.Head class="text-center">Products</Table.Head>
						<Table.Head class="text-right">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each data.categories as category (category.categoryId)}
						<Table.Row class="cursor-pointer" onclick={() => openDrawer(category)}>
							<Table.Cell class="font-medium">{category.categoryName}</Table.Cell>
							<Table.Cell class="hidden sm:table-cell text-muted-foreground">
								{category.categoryGroupName || '—'}
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
							<Table.Cell class="text-right">
								<!-- svelte-ignore a11y_click_events_have_key_events -->
								<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
								<div
									class="flex items-center justify-end gap-2"
									role="group"
									onclick={(e) => e.stopPropagation()}
								>
									{#if canModify}
										<a
											href="/inventory/category/{category.categoryId}/edit"
											class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
											title="Edit category"
										>
											<Pencil class="h-4 w-4" />
										</a>
									{/if}
									{#if canModify}
										<Button
											variant="ghost"
											size="icon"
											onclick={() => openDeleteDialog(category.categoryId, category.categoryName)}
											title="Delete category"
											disabled={category.productCount > 0}
										>
											<Trash2 class="h-4 w-4 text-destructive" />
										</Button>
									{/if}
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Root>

		<!-- Pagination -->
		{#if data.pagination.total > data.pagination.perPage}
			<div class="flex flex-col items-center justify-center gap-2 py-6">
				<div class="text-sm text-muted-foreground">
					Page <span class="font-semibold">{data.pagination.currentPage}</span>
					of
					<span class="font-semibold"
						>{Math.ceil(data.pagination.total / data.pagination.perPage)}</span
					>
					&middot;
					<span class="font-semibold">{data.pagination.total}</span>
					{data.pagination.total === 1 ? 'category' : 'categories'} total
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
		{:else}
			<p class="text-sm text-muted-foreground mt-4">
				{data.pagination.total}
				{data.pagination.total === 1 ? 'category' : 'categories'} total
			</p>
		{/if}
	{/if}
</div>

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
