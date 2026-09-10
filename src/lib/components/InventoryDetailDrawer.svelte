<script lang="ts">
	import { onMount } from 'svelte';

	import { Button } from '$lib/components/ui/button';
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

	// mobile slides up from the bottom (sheet); desktop keeps the right-side drawer
	let isMobile = $state(false);
	onMount(() => {
		const mq = window.matchMedia('(max-width: 767px)');
		isMobile = mq.matches;
		const handler = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		side={isMobile ? 'bottom' : 'right'}
		showClose={false}
		class="flex flex-col p-0 {isMobile ? 'max-h-[85vh] rounded-t-2xl' : 'w-full sm:max-w-md'}"
	>
		<Sheet.Header class="sr-only">
			<Sheet.Title>Product Details</Sheet.Title>
		</Sheet.Header>

		<div class="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
			{#if product}
				<InventoryItem {product} {recipeCount} {showStock} {onStockChange} {onDelete} />
			{:else}
				<div class="flex items-center justify-center h-32 text-muted-foreground">
					No product selected
				</div>
			{/if}

			<Button variant="secondary" class="w-full" onclick={() => (open = false)}>Close</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>
