<script lang="ts">
	import type { Product } from '$lib/types';
	import placeholder from '$lib/assets/placeholder@2x.jpg';
	import * as Card from '$lib/components/ui/card';
	import * as Popover from '$lib/components/ui/popover';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Separator } from '$lib/components/ui/separator';
	import { ArrowRight, Pencil, Info } from 'lucide-svelte';
	import { weightedMean } from '$lib/math';
	import { getContext } from 'svelte';

	export let product: Product;
	export let isBaseSpirit: boolean;

	const permissions: string[] = getContext('permissions');

	// fallback if image cant load
	let productImage = product?.productImageUrl || placeholder;
	const imageLoadError = () => (productImage = placeholder);

	const generateRatings = () => {
		const ratings = [
			{ label: 'Dryness', rating: product.productDrynessRating || 0.0 },
			{ label: 'Sweetness', rating: product.productSweetnessRating || 0.0 },
		];

		const ratings2 = [
			{ label: 'Strength', rating: product.productStrengthRating || 0.0 },
			{ label: 'Versatility', rating: product.productVersatilityRating || 0.0 },
		];

		const ratingsMap = [
			{ max: 0, desc2: 'No Rating', style: 'bg-gray-500' },
			{ max: 1, desc2: 'Swill', style: 'bg-red-500' },
			{ max: 2, desc2: 'Forgettable', style: 'bg-red-500' },
			{ max: 3, desc2: 'Bottom Shelf', style: 'bg-red-500' },
			{ max: 4, desc2: 'Decent', style: 'bg-yellow-500' },
			{ max: 5, desc2: 'Standard Pour', style: 'bg-yellow-500' },
			{ max: 6, desc2: 'Good Stuff', style: 'bg-green-500' },
			{ max: 7, desc2: 'Top Shelf', style: 'bg-green-500' },
			{ max: 8, desc2: "Connoisseur's Choice", style: 'bg-green-500' },
			{ max: 9, desc2: "Bartender's Favorite", style: 'bg-blue-500' },
		];

		let vec: number[] | number = ratings.concat(ratings2).map(({ rating }) => rating);
		vec = weightedMean(vec, [6.5, 3.5, 0.95, 11.5]);
		const { desc2, style } = ratingsMap.find(({ max }) => vec <= max) || {
			desc2: 'Best in House',
			style: 'bg-violet-500',
		};
		return {
			ratings,
			ratings2,
			desc1: vec.toFixed(1),
			desc2,
			style,
		};
	};

	const { ratings, ratings2, desc1, desc2, style } = generateRatings();
</script>

{#if product}
	<div class="space-y-2 text-wrap w-full">
		<!-- desktop only -->
		<div class="hidden sm:py-4 md:py-6 sm:flex sm:flex-auto sm:justify-center grow">
			<img class="hidden" src={product.productImageUrl} onerror={imageLoadError} alt="" />
			<Card.Root class="!w-full glass-card flex flex-row overflow-hidden">
				<img
					src={productImage}
					alt={product.productName}
					class="w-48 h-auto object-cover"
					onerror={imageLoadError}
				/>
				<div class="card-content p-6 flex-1">
					<!-- heading -->
					<div>
						<h5 class="text-xl font-bold tracking-tight text-foreground">
							{product.productName}
						</h5>
						<Popover.Root>
							<Popover.Trigger class="flex items-center text-muted-foreground hover:text-foreground">
								{product.categoryName}
								<Info class="w-4 h-4 ml-1" />
							</Popover.Trigger>
							<Popover.Content class="w-80">
								<div class="space-y-2">
									<h4 class="font-medium">{product.categoryName}</h4>
									<p class="text-sm text-muted-foreground">{product.categoryDescription}</p>
									<a
										href="/inventory/category/{product.categoryId}/edit"
										class="inline-flex items-center text-sm font-medium text-primary hover:underline"
									>
										Edit <ArrowRight class="ml-1 h-4 w-4" />
									</a>
								</div>
							</Popover.Content>
						</Popover.Root>
					</div>

					<!-- desc -->
					<div class="py-2">
						<p class="font-normal text-muted-foreground leading-tight">
							{product.productDescription || product.categoryDescription}
						</p>
					</div>

					<!-- score -->
					{#if isBaseSpirit}
						<div class="py-4">
							<div class="flex items-center gap-4">
								<span class="w-10 text-sm font-semibold inline-flex items-center justify-center p-1.5 rounded text-white {style}">
									{desc1}
								</span>
								<span class="text-sm font-medium">{desc2}</span>
								{#if product.productProof > 0}
									<span class="text-sm text-muted-foreground">{product.productProof} Proof</span>
								{/if}
							</div>
							<div class="mt-4 grid grid-cols-2 gap-4">
								{#each [...ratings, ...ratings2] as r}
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">{r.label}</span>
										<span class="font-medium">{r.rating.toFixed(1)}</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<div class="sm:gap-4 sm:items-center sm:flex mt-4">
						{#if permissions.includes('edit_inventory')}
							<a class={cn(buttonVariants({ variant: "outline" }))} href="/inventory/{product.productId}/edit">
								<Pencil class="w-4 h-4 mr-2" />
								Edit
							</a>
						{/if}
					</div>
				</div>
			</Card.Root>
		</div>

		<!-- mobile only -->
		<div class="sm:hidden flex justify-center px-2 py-4 md:py-2 md:pb-4 w-full">
			<Card.Root class="glass-card w-full">
				<img
					src={product.productImageUrl || placeholder}
					alt={product.productName}
					class="w-full h-48 object-cover rounded-t-lg"
				/>
				<Card.Content class="p-4">
					<h5 class="text-xl font-bold tracking-tight text-foreground">
						{product.productName}
					</h5>
					<div class="flex items-center text-muted-foreground">
						<span>{product.categoryName}</span>
					</div>
					<div class="flex gap-2 my-2">
						{#if isBaseSpirit}
							<Badge variant="secondary">Base Spirit</Badge>
						{/if}
						{#if product.productInStockQuantity < 1}
							<Badge variant="destructive">Out of Stock</Badge>
						{/if}
					</div>
					<p class="my-3 font-normal text-muted-foreground leading-tight">
						{product.productDescription || product.categoryDescription}
					</p>

					{#if isBaseSpirit}
						<Separator class="my-4" />
						<div class="px-2">
							<div class="flex items-center gap-4 mb-4">
								<span class="w-10 text-sm font-semibold inline-flex items-center justify-center p-1.5 rounded text-white {style}">
									{desc1}
								</span>
								<span class="text-sm font-medium">{desc2}</span>
							</div>
							<div class="grid grid-cols-2 gap-2">
								{#each [...ratings, ...ratings2] as r}
									<div class="flex justify-between text-sm">
										<span class="text-muted-foreground">{r.label}</span>
										<span class="font-medium">{r.rating.toFixed(1)}</span>
									</div>
								{/each}
							</div>
						</div>
						<Separator class="my-4" />
					{/if}

					<div class="mt-4">
						<a class={cn(buttonVariants({ variant: "outline" }), "w-full")} href="/inventory/{product.productId}/edit">
							<Pencil class="w-4 h-4 mr-2" />
							Edit
						</a>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center h-48 bg-muted rounded-lg">
		<span class="text-muted-foreground">No product data</span>
	</div>
{/if}

<style>
	@media (min-width: 768px) {
		.card-content {
			width: 440px;
		}
	}

	@media (min-width: 1024px) {
		.card-content {
			width: 685px;
		}
	}

	@media (min-width: 1280px) {
		.card-content {
			width: 900px;
		}
	}
</style>
