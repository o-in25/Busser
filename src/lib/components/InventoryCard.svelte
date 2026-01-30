<script lang="ts">
	import { AlertTriangle, CheckCircle2, FlaskConical, XCircle } from 'lucide-svelte';

	import placeholderDark from '$lib/assets/placeholder-alt-dark.png';
	import placeholderLight from '$lib/assets/placeholder-alt-light.png';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import type { Product } from '$lib/types';

	let {
		product,
		viewMode = 'grid',
		recipeCount = 0,
		onClick = null,
	}: {
		product: Product;
		viewMode?: 'grid' | 'list';
		recipeCount?: number;
		onClick?: ((product: Product) => void) | null;
	} = $props();

	function handleClick(e: MouseEvent) {
		if (onClick) {
			e.preventDefault();
			onClick(product);
		}
	}

	// Stock status helpers
	const stockStatus = $derived.by(() => {
		if (product.productInStockQuantity === 0) {
			return {
				label: 'Out of Stock',
				variant: 'destructive' as const,
				icon: XCircle,
				color: 'text-red-500',
			};
		}
		if (product.productInStockQuantity === 1) {
			return {
				label: 'Low Stock',
				variant: 'secondary' as const,
				icon: AlertTriangle,
				color: 'text-yellow-500',
			};
		}
		return {
			label: 'In Stock',
			variant: 'default' as const,
			icon: CheckCircle2,
			color: 'text-green-500',
		};
	});

	const StockIcon = $derived(stockStatus.icon);
</script>

{#if viewMode === 'grid'}
	<!-- Grid View Card -->
	<a href="/inventory/{product.productId}/edit" class="block group" onclick={handleClick}>
		<Card.Root class="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
			<!-- Image -->
			<div class="relative h-44 overflow-hidden">
				{#if product.productImageUrl}
					<img
						src={product.productImageUrl}
						alt={product.productName}
						class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
					/>
				{:else}
					<div
						class="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center dark:hidden"
					>
						<img
							src={placeholderLight}
							alt={product.productName}
							class="w-20 h-20 object-contain opacity-40"
						/>
					</div>
					<div
						class="w-full h-full bg-gradient-to-br from-muted to-muted/50 items-center justify-center hidden dark:flex"
					>
						<img
							src={placeholderDark}
							alt={product.productName}
							class="w-20 h-20 object-contain opacity-40"
						/>
					</div>
				{/if}
				<!-- Gradient overlay on hover -->
				<div
					class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
				></div>

				<!-- Category badge -->
				<Badge variant="secondary" class="absolute top-3 left-3 bg-background/80 backdrop-blur-sm">
					{product.categoryName}
				</Badge>

				<!-- Stock status badge -->
				<div class="absolute top-3 right-3">
					<Badge variant={stockStatus.variant} class="bg-background/80 backdrop-blur-sm">
						<StockIcon class="h-3 w-3 mr-1 {stockStatus.color}" />
						{stockStatus.label}
					</Badge>
				</div>
			</div>

			<!-- Content -->
			<Card.Content class="p-4">
				<h3 class="font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
					{product.productName}
				</h3>
				<p class="text-sm text-muted-foreground line-clamp-2 mb-2">
					{product.productDescription || product.categoryDescription || 'No description available'}
				</p>

				<!-- Recipe usage indicator -->
				{#if recipeCount > 0}
					<div class="flex items-center gap-1.5 text-xs text-muted-foreground">
						<FlaskConical class="h-3.5 w-3.5" />
						<span>Used in {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}</span>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</a>
{:else}
	<!-- List View Card -->
	<a href="/inventory/{product.productId}/edit" class="block group" onclick={handleClick}>
		<Card.Root class="hover:shadow-md transition-all duration-200">
			<div class="flex items-center gap-4 p-3">
				<!-- Thumbnail -->
				<div class="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
					{#if product.productImageUrl}
						<img
							src={product.productImageUrl}
							alt={product.productName}
							class="w-full h-full object-cover"
						/>
					{:else}
						<div class="w-full h-full bg-muted flex items-center justify-center dark:hidden">
							<img
								src={placeholderLight}
								alt={product.productName}
								class="w-10 h-10 object-contain opacity-40"
							/>
						</div>
						<div class="w-full h-full bg-muted items-center justify-center hidden dark:flex">
							<img
								src={placeholderDark}
								alt={product.productName}
								class="w-10 h-10 object-contain opacity-40"
							/>
						</div>
					{/if}
				</div>

				<!-- Content -->
				<div class="flex-1 min-w-0">
					<div class="flex items-start justify-between gap-2">
						<div class="min-w-0">
							<h3 class="font-bold text-base group-hover:text-primary transition-colors truncate">
								{product.productName}
							</h3>
							<p class="text-sm text-muted-foreground line-clamp-1">
								{product.productDescription || product.categoryDescription || 'No description'}
							</p>
						</div>
						<div class="flex flex-col gap-1 shrink-0 items-end">
							<Badge variant="secondary">
								{product.categoryName}
							</Badge>
							<Badge variant={stockStatus.variant}>
								<StockIcon class="h-3 w-3 mr-1 {stockStatus.color}" />
								{stockStatus.label}
							</Badge>
						</div>
					</div>

					<!-- Meta info -->
					<div class="flex items-center gap-3 mt-2">
						{#if recipeCount > 0}
							<span class="flex items-center gap-1 text-xs text-muted-foreground">
								<FlaskConical class="h-3.5 w-3.5" />
								Used in {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}
							</span>
						{/if}
						{#if product.productProof > 0}
							<span class="text-xs text-muted-foreground">
								{product.productProof} Proof
							</span>
						{/if}
					</div>
				</div>
			</div>
		</Card.Root>
	</a>
{/if}
