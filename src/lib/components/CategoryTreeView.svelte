<script lang="ts">
	import {
		ChevronDown,
		ChevronRight,
		FolderOpen,
		Package,
		Pencil,
		Trash2,
	} from 'lucide-svelte';
	import { slide } from 'svelte/transition';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Dialog from '$lib/components/ui/dialog';
	import type { Category, Product } from '$lib/types';

	let {
		category,
		subcategories = [],
		products = [],
		subcategoryProducts = {},
		canModify = false,
		onProductDeleted,
	}: {
		category: Category;
		subcategories: (Category & { productCount: number })[];
		products: Product[];
		subcategoryProducts: Record<number, Product[]>;
		canModify?: boolean;
		onProductDeleted?: () => void;
	} = $props();

	// Track which subcategories are expanded (all expanded by default)
	let expandedSubs = $state<Set<number>>(new Set());

	// Update expanded set when subcategories change
	$effect(() => {
		expandedSubs = new Set(subcategories.map((s) => s.categoryId));
	});

	function toggleSub(id: number) {
		const next = new Set(expandedSubs);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		expandedSubs = next;
	}

	// Delete confirmation
	let deleteDialogOpen = $state(false);
	let productToDelete = $state<Product | null>(null);
	let isDeleting = $state(false);

	function openDeleteDialog(product: Product) {
		productToDelete = product;
		deleteDialogOpen = true;
	}

	async function confirmDelete() {
		if (!productToDelete?.productId) return;
		isDeleting = true;

		try {
			const res = await fetch(`/api/inventory/${productToDelete.productId}`, {
				method: 'DELETE',
			});
			const result = await res.json();
			if (result.status === 'success') {
				deleteDialogOpen = false;
				productToDelete = null;
				onProductDeleted?.();
			}
		} finally {
			isDeleting = false;
		}
	}

	const totalProducts = $derived(
		products.length +
			subcategories.reduce((sum, s) => sum + (subcategoryProducts[s.categoryId]?.length || 0), 0)
	);
</script>

<!-- Category Header -->
<div class="mb-6">
	<div class="flex items-center gap-3 mb-2">
		<h2 class="text-xl font-semibold">{category.categoryName}</h2>
		<Badge variant="secondary">{totalProducts} product{totalProducts !== 1 ? 's' : ''}</Badge>
	</div>
	{#if category.categoryDescription}
		<p class="text-sm text-muted-foreground mb-3">{category.categoryDescription}</p>
	{/if}
	<a
		href="/inventory/category/{category.categoryId}/edit"
		class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
	>
		<Pencil class="h-3.5 w-3.5" />
		Edit category
	</a>
</div>

<!-- Tree -->
<div class="space-y-1">
	<!-- Direct products -->
	{#if products.length > 0}
		<div class="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1.5">
			Products
		</div>
		{#each products as product (product.productId)}
			<div
				class="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
			>
				<Package class="h-4 w-4 text-muted-foreground shrink-0" />
				<span class="text-sm flex-1 truncate">{product.productName}</span>
				{#if canModify}
					<button
						type="button"
						class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
						title="Delete product"
						onclick={() => openDeleteDialog(product)}
					>
						<Trash2 class="h-3.5 w-3.5 text-destructive" />
					</button>
				{/if}
			</div>
		{/each}
	{/if}

	<!-- Subcategories -->
	{#if subcategories.length > 0}
		<div
			class="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1.5 mt-4"
		>
			Subcategories
		</div>
		{#each subcategories as sub (sub.categoryId)}
			{@const subProducts = subcategoryProducts[sub.categoryId] || []}
			<div>
				<button
					type="button"
					class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors text-left"
					onclick={() => toggleSub(sub.categoryId)}
				>
					{#if expandedSubs.has(sub.categoryId)}
						<ChevronDown class="h-4 w-4 text-muted-foreground shrink-0" />
					{:else}
						<ChevronRight class="h-4 w-4 text-muted-foreground shrink-0" />
					{/if}
					<FolderOpen class="h-4 w-4 text-primary shrink-0" />
					<span class="text-sm font-medium flex-1">{sub.categoryName}</span>
					<Badge variant="outline" class="text-xs">{sub.productCount}</Badge>
				</button>

				{#if expandedSubs.has(sub.categoryId)}
					<div class="ml-6 border-l pl-2 mt-0.5" transition:slide={{ duration: 150 }}>
						{#if subProducts.length === 0}
							<div class="text-xs text-muted-foreground px-2 py-1.5 italic">
								No products
							</div>
						{:else}
							{#each subProducts as product (product.productId)}
								<div
									class="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
								>
									<Package class="h-4 w-4 text-muted-foreground shrink-0" />
									<span class="text-sm flex-1 truncate">{product.productName}</span>
									{#if canModify}
										<button
											type="button"
											class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
											title="Delete product"
											onclick={() => openDeleteDialog(product)}
										>
											<Trash2 class="h-3.5 w-3.5 text-destructive" />
										</button>
									{/if}
								</div>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		{/each}
	{/if}

	<!-- Empty state -->
	{#if products.length === 0 && subcategories.length === 0}
		<div class="flex flex-col items-center justify-center py-8 text-center">
			<Package class="h-10 w-10 text-muted-foreground/40 mb-3" />
			<p class="text-sm text-muted-foreground">No products or subcategories in this category</p>
		</div>
	{/if}
</div>

<!-- Delete Confirmation Dialog -->
<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete Product</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete "{productToDelete?.productName}"? This action cannot be
				undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button
				variant="outline"
				onclick={() => (deleteDialogOpen = false)}
				disabled={isDeleting}
			>
				Cancel
			</Button>
			<Button variant="destructive" onclick={confirmDelete} disabled={isDeleting}>
				{isDeleting ? 'Deleting...' : 'Delete'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
