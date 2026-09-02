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
		onDelete = null,
	}: {
		open?: boolean;
		product: Product | null;
		recipeCount?: number;
		showStock?: boolean;
		onStockChange?: ((productId: number, inStock: boolean) => void) | null;
		onDelete?: (() => void) | null;
	} = $props();
</script>

<Sheet.Root bind:open>
	<!-- glass surface matching the nav (translucent + blur lets the page mesh bleed through)
	     instead of the flat default sheet bg -->
	<Sheet.Content
		side="right"
		class="w-full sm:max-w-md p-0 flex flex-col bg-white/60 dark:bg-white/[0.08] border-white/45 dark:border-white/[0.09] backdrop-saturate-[1.7]"
	>
		<Sheet.Header class="sr-only">
			<Sheet.Title>Product Details</Sheet.Title>
		</Sheet.Header>

		<!-- scroll on the inner wrapper, not Content — keeps the pinned close button unclipped -->
		<div class="flex-1 min-h-0 overflow-y-auto p-4 pt-14">
			{#if product}
				<InventoryItem {product} {recipeCount} {showStock} {onStockChange} {onDelete} />
			{:else}
				<div class="flex items-center justify-center h-32 text-muted-foreground">
					No product selected
				</div>
			{/if}
		</div>
	</Sheet.Content>
</Sheet.Root>
