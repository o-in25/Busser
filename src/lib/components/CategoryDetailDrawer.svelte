<script lang="ts">
	import { Loader2 } from 'lucide-svelte';

	import * as Sheet from '$lib/components/ui/sheet';
	import type { Category, Product } from '$lib/types';

	import CategoryTreeView from './CategoryTreeView.svelte';

	let {
		open = $bindable(false),
		category,
		canModify = false,
		onProductDeleted,
	}: {
		open?: boolean;
		category: Category | null;
		canModify?: boolean;
		onProductDeleted?: () => void;
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
				<div class="flex items-center justify-center h-32">
					<Loader2 class="h-6 w-6 animate-spin text-muted-foreground" />
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
			{:else}
				<div class="flex items-center justify-center h-32 text-muted-foreground">
					No category selected
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
