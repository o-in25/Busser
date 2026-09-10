<script lang="ts">
	import { Pencil, Trash2 } from 'lucide-svelte';

	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import type { Category, Product } from '$lib/types';
	import { cn } from '$lib/utils';

	import CategoryTreeView from './CategoryTreeView.svelte';

	let {
		open = $bindable(false),
		category,
		canModify = false,
		onProductDeleted,
		onDelete,
	}: {
		open?: boolean;
		category: (Category & { productCount?: number }) | null;
		canModify?: boolean;
		onProductDeleted?: () => void;
		onDelete?: () => void;
	} = $props();

	let loading = $state(false);
	let errorMsg = $state('');
	let subcategories = $state<(Category & { productCount: number })[]>([]);
	let products = $state<Product[]>([]);
	let subcategoryProducts = $state<Record<number, Product[]>>({});

	$effect(() => {
		if (open && category?.categoryId) {
			fetchCategoryDetails(category.categoryId);
		}
	});

	async function fetchCategoryDetails(categoryId: number) {
		loading = true;
		errorMsg = '';
		try {
			const res = await fetch(`/api/inventory/category/${categoryId}/products`);
			if (!res.ok) throw new Error('Failed to load category details');
			const data = await res.json();
			subcategories = data.subcategories;
			products = data.products;
			subcategoryProducts = data.subcategoryProducts;
		} catch (e: any) {
			errorMsg = e.message || 'An error occurred';
		} finally {
			loading = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full sm:max-w-lg overflow-y-auto">
		<Sheet.Header class="pb-4 border-b">
			<Sheet.Title class="text-lg font-semibold">Category Details</Sheet.Title>
		</Sheet.Header>

		<div class="py-6">
			{#if loading}
				<div aria-busy="true" aria-label="Loading category">
					<!-- header: title + count badge, description -->
					<div class="mb-6">
						<div class="flex items-center gap-3 mb-3">
							<div class="shimmer h-6 w-40 rounded-md"></div>
							<div class="shimmer h-6 w-20 rounded-full"></div>
						</div>
						<div class="shimmer h-4 w-full rounded-md mb-1.5"></div>
						<div class="shimmer h-4 w-2/3 rounded-md"></div>
					</div>
					<!-- product rows -->
					<div class="shimmer h-3 w-16 rounded-md ml-2 mb-3"></div>
					<div class="space-y-1">
						{#each Array(6) as _}
							<div class="flex items-center gap-2 px-2 py-1.5">
								<div class="shimmer h-4 w-4 rounded shrink-0"></div>
								<div class="shimmer h-4 w-48 rounded-md"></div>
							</div>
						{/each}
					</div>
				</div>
			{:else if errorMsg}
				<div class="flex items-center justify-center h-32 text-destructive text-sm">
					{errorMsg}
				</div>
			{:else if category}
				<CategoryTreeView
					{category}
					{subcategories}
					{products}
					{subcategoryProducts}
					{canModify}
					{onProductDeleted}
				/>

				{#if canModify}
					<div class="flex items-center justify-end gap-2 pt-6 mt-6 border-t border-white/10">
						<Button
							variant="outline"
							size="sm"
							class="text-red-400 border-destructive/50 bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground"
							onclick={() => onDelete?.()}
							disabled={(category.productCount ?? 0) > 0}
							title={(category.productCount ?? 0) > 0
								? 'Move or remove products before deleting'
								: 'Delete category'}
						>
							<Trash2 class="w-4 h-4 mr-1.5" />
							Delete
						</Button>
						<a
							href="/inventory/category/{category.categoryId}/edit"
							class={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
						>
							<Pencil class="w-4 h-4 mr-1.5" />
							Edit
						</a>
					</div>
				{/if}
			{:else}
				<div class="flex items-center justify-center h-32 text-muted-foreground">
					No category selected
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
