<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import type { Product } from '$lib/types';

	import InventoryItem from './InventoryItem.svelte';

	let {
		open = $bindable(false),
		product,
		recipeCount = 0,
		showStock = true,
		onStockChange = null,
	}: {
		open?: boolean;
		product: Product | null;
		recipeCount?: number;
		showStock?: boolean;
		onStockChange?: ((productId: number, inStock: boolean) => void) | null;
	} = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full sm:max-w-md overflow-y-auto p-0">
		<Sheet.Header class="sr-only">
			<Sheet.Title>Product Details</Sheet.Title>
		</Sheet.Header>

		<div class="p-4">
			{#if product}
				<InventoryItem {product} {recipeCount} {showStock} {onStockChange} />
			{:else}
				<div class="flex items-center justify-center h-32 text-muted-foreground">
					No product selected
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
