<script lang="ts">
	import type { Product, Spirit } from '$lib/types';
	import * as Sheet from '$lib/components/ui/sheet';
	import InventoryItem from './InventoryItem.svelte';
	import { X } from 'lucide-svelte';

	let {
		open = $bindable(false),
		product,
		recipeCount = 0,
		tableData = [],
		onStockChange = null
	}: {
		open?: boolean;
		product: Product | null;
		recipeCount?: number;
		tableData?: Spirit[];
		onStockChange?: ((productId: number, inStock: boolean) => void) | null;
	} = $props();

	// Check if product is a base spirit
	const isBaseSpirit = $derived.by(() => {
		if (!product || !tableData.length) return false;
		const regex = new RegExp(
			`\\b(${tableData.map(({ recipeCategoryDescription }) => recipeCategoryDescription.toLowerCase()).join('|')})\\b`,
			'i'
		);
		return regex.test(product.categoryName);
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full sm:max-w-lg overflow-y-auto">
		<Sheet.Header class="pb-4 border-b">
			<div class="flex items-center justify-between">
				<Sheet.Title class="text-lg font-semibold">
					Product Details
				</Sheet.Title>
			</div>
		</Sheet.Header>

		<div class="py-6">
			{#if product}
				<InventoryItem
					{product}
					{isBaseSpirit}
					{recipeCount}
					{onStockChange}
				/>
			{:else}
				<div class="flex items-center justify-center h-32 text-muted-foreground">
					No product selected
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
