<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import type { Product } from '$lib/types';

	import InventoryItem from './InventoryItem.svelte';

	let {
		open = $bindable(false),
		product,
		recipeCount = 0,
		onStockChange = null,
	}: {
		open?: boolean;
		product: Product | null;
		recipeCount?: number;
		onStockChange?: ((productId: number, inStock: boolean) => void) | null;
	} = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full sm:max-w-lg overflow-y-auto">
		<Sheet.Header class="pb-4 border-b">
			<div class="flex items-center justify-between">
				<Sheet.Title class="text-lg font-semibold">Product Details</Sheet.Title>
			</div>
		</Sheet.Header>

		<div class="py-6">
			{#if product}
				<InventoryItem {product} {recipeCount} {onStockChange} />
			{:else}
				<div class="flex items-center justify-center h-32 text-muted-foreground">
					No product selected
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
