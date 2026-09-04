<script lang="ts">
	import {
		Beaker,
		Calculator,
		Candy,
		CheckCircle2,
		ChevronRight,
		DollarSign,
		Flame,
		Pencil,
		Sparkles,
		Trash2,
		Wind,
		XCircle,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { Badge } from '$lib/components/ui/badge';
	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { weightedMean } from '$lib/math';
	import type { Product, View } from '$lib/types';
	import { roleCanModify, type WorkspaceWithRole } from '$lib/types/workspace';

	let {
		product,
		recipeCount = 0,
		showStock = true,
		onStockChange = null,
		onDelete = null,
	}: {
		product: Product;
		recipeCount?: number;
		showStock?: boolean;
		onStockChange?: ((productId: number, inStock: boolean) => void) | null;
		onDelete?: (() => void) | null;
	} = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = roleCanModify(workspace?.workspaceRole);

	let recipes = $state<View.BasicRecipe[]>([]);
	let recipeTotal = $state(0);
	let recipesLoading = $state(false);

	$effect(() => {
		const id = product?.productId;
		if (!id || recipeCount === 0) {
			recipes = [];
			recipeTotal = 0;
			return;
		}
		recipesLoading = true;
		fetch(`/api/inventory/${id}/recipes`)
			.then((res) => (res.ok ? res.json() : { recipes: [], total: 0 }))
			.then((data) => {
				recipes = data.recipes ?? [];
				recipeTotal = data.total ?? 0;
			})
			.catch(() => {
				recipes = [];
				recipeTotal = 0;
			})
			.finally(() => (recipesLoading = false));
	});

	const pricePerOunce = $derived.by(() => {
		const price = product.productPricePerUnit;
		const size = product.productUnitSizeInMilliliters;
		if (!price || !size || size === 0) return null;
		return (price / (size / 29.5735)).toFixed(2);
	});

	const abvPercent = $derived.by(() => {
		const proof = product.productProof;
		if (!proof) return null;
		return (proof / 2).toFixed(1);
	});

	const stockStatus = $derived.by(() => {
		if (product.productInStockQuantity === 0) {
			return {
				label: 'Out of Stock',
				variant: 'destructive' as const,
				icon: XCircle,
				color: 'text-red-500',
				bgColor: 'bg-red-500/10',
			};
		}
		return {
			label: 'In Stock',
			variant: 'default' as const,
			icon: CheckCircle2,
			color: 'text-neon-green-500',
			bgColor: 'bg-neon-green-500/10',
		};
	});

	const StockIcon = $derived(stockStatus.icon);

	const flavorProfile = $derived([
		{
			label: 'Sweetness',
			value: product.productSweetnessRating || 0,
			icon: Candy,
			color: 'bg-primary-500',
		},
		{
			label: 'Dryness',
			value: product.productDrynessRating || 0,
			icon: Wind,
			color: 'bg-neon-amber-500',
		},
		{
			label: 'Versatility',
			value: product.productVersatilityRating || 0,
			icon: Sparkles,
			color: 'bg-secondary-500',
		},
		{
			label: 'Strength',
			value: product.productStrengthRating || 0,
			icon: Flame,
			color: 'bg-neon-amber-500',
		},
	]);

	const hasFlavorProfile = $derived(
		product.categoryGroupId === 1 && flavorProfile.some((f) => f.value > 0)
	);

	const hasQuickStats = $derived(
		!!product.productPricePerUnit ||
			!!product.productUnitSizeInMilliliters ||
			!!product.productProof ||
			!!pricePerOunce
	);

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
			{ max: 4, desc2: 'Decent', style: 'bg-neon-yellow-500' },
			{ max: 5, desc2: 'Standard Pour', style: 'bg-neon-yellow-500' },
			{ max: 6, desc2: 'Good Stuff', style: 'bg-neon-green-500' },
			{ max: 7, desc2: 'Top Shelf', style: 'bg-neon-green-500' },
			{ max: 8, desc2: "Connoisseur's Choice", style: 'bg-neon-green-500' },
			{ max: 9, desc2: "Bartender's Favorite", style: 'bg-blue-500' },
		];

		let vec: number[] | number = ratings.concat(ratings2).map(({ rating }) => rating);
		vec = weightedMean(vec, [6.5, 3.5, 0.95, 11.5]);
		const { desc2, style } = ratingsMap.find(({ max }) => vec <= max) || {
			desc2: 'Best in House',
			style: 'bg-secondary-500',
		};
		return {
			score: vec.toFixed(1),
			label: desc2,
			style,
		};
	};

	const overallRating = generateRatings();

	function handleStockToggle(checked: boolean) {
		if (onStockChange && product.productId) {
			onStockChange(product.productId, checked);
		}
	}
</script>

{#if product}
	<div class="space-y-4">
		<!-- Hero -->
		<div class="relative rounded-xl overflow-hidden">
			<div class="aspect-[3/2] w-full">
				<SkeletonImage
					src={product.productImageUrl}
					alt={product.productName}
					variant="product"
					class="h-full w-full"
				/>
			</div>
			<div
				class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"
			></div>

			<div class="absolute inset-x-0 bottom-0 p-4">
				<h2 class="text-xl font-bold text-foreground leading-tight">
					{product.productName}
				</h2>
			</div>
		</div>

		<!-- Stock status -->
		{#if showStock}
			<div class="flex items-center gap-2 flex-wrap">
				<Badge size="lg" variant={product.productInStockQuantity > 0 ? 'default' : 'danger'}>
					<StockIcon class="h-3.5 w-3.5 {stockStatus.color}" />
					<span class="text-xs">{stockStatus.label}</span>
				</Badge>
			</div>
		{/if}

		<!-- Stat card — verdict lead + labeled numeric grid -->
		{#if hasFlavorProfile || hasQuickStats}
			<div class="glass-surface p-3 space-y-3">
				{#if hasFlavorProfile}
					<div class="flex items-center gap-3 pb-3 border-b border-white/10">
						<span
							class="shrink-0 flex items-center justify-center h-11 w-11 rounded-xl text-white shadow-lg {overallRating.style}"
						>
							<span class="text-lg font-bold leading-none">{overallRating.score}</span>
						</span>
						<div class="min-w-0">
							<div class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
								Verdict
							</div>
							<div class="text-sm font-semibold text-foreground">{overallRating.label}</div>
						</div>
					</div>
				{/if}
				<div class="grid grid-cols-2 gap-x-4 gap-y-3">
					{#if product.productPricePerUnit}
						<div class="flex items-center gap-2">
							<DollarSign class="h-4 w-4 shrink-0 text-neon-green-500" />
							<div class="min-w-0">
								<div class="text-[11px] text-muted-foreground uppercase tracking-wide">Price</div>
								<div class="text-sm font-semibold">${product.productPricePerUnit.toFixed(2)}</div>
							</div>
						</div>
					{/if}
					{#if product.productUnitSizeInMilliliters}
						<div class="flex items-center gap-2">
							<Beaker class="h-4 w-4 shrink-0 text-blue-500" />
							<div class="min-w-0">
								<div class="text-[11px] text-muted-foreground uppercase tracking-wide">Bottle</div>
								<div class="text-sm font-semibold">{product.productUnitSizeInMilliliters} mL</div>
							</div>
						</div>
					{/if}
					{#if product.productProof}
						<div class="flex items-center gap-2">
							<Flame class="h-4 w-4 shrink-0 text-neon-amber-500" />
							<div class="min-w-0">
								<div class="text-[11px] text-muted-foreground uppercase tracking-wide">Proof</div>
								<div class="text-sm font-semibold">
									{product.productProof}°{#if abvPercent}<span
											class="font-normal text-muted-foreground"
										>
											({abvPercent}%)</span
										>{/if}
								</div>
							</div>
						</div>
					{/if}
					{#if pricePerOunce}
						<div class="flex items-center gap-2">
							<Calculator class="h-4 w-4 shrink-0 text-secondary-500" />
							<div class="min-w-0">
								<div class="text-[11px] text-muted-foreground uppercase tracking-wide">Per oz</div>
								<div class="text-sm font-semibold">${pricePerOunce}</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Category — inline (replaces the old tooltip), parent › child hierarchy -->
		{#if product.categoryName}
			<div class="glass-surface p-3 space-y-1.5">
				<h3 class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
					Category
				</h3>
				<div class="flex items-center gap-1 flex-wrap text-sm">
					{#if product.categoryGroupName}
						<span class="text-muted-foreground">{product.categoryGroupName}</span>
						<ChevronRight class="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
					{/if}
					<span class="font-semibold text-foreground">{product.categoryName}</span>
				</div>
				{#if product.categoryDescription}
					<p class="text-sm text-foreground/90 leading-relaxed">{product.categoryDescription}</p>
				{/if}
				<a
					href="/inventory/category/{product.categoryId}/edit"
					class="inline-flex items-center rounded-sm text-sm font-medium text-primary hover:underline focus-visible:underline focus-visible:outline-none"
				>
					Edit Category <ChevronRight class="ml-0.5 h-3.5 w-3.5" />
				</a>
			</div>
		{/if}

		<!-- Flavor Profile -->
		{#if hasFlavorProfile}
			<div class="glass-surface p-3 space-y-2.5">
				<h3 class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
					Flavor Profile
				</h3>
				{#each flavorProfile as flavor}
					{#if flavor.value > 0}
						{@const FlavorIcon = flavor.icon}
						<div class="flex items-center gap-2.5">
							<FlavorIcon class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
							<span class="text-xs w-16 shrink-0 text-muted-foreground">{flavor.label}</span>
							<div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
								<div
									class="h-full rounded-full {flavor.color} transition-all"
									style="width: {(flavor.value / 10) * 100}%"
								></div>
							</div>
							<span class="text-xs font-medium w-7 text-right text-muted-foreground"
								>{flavor.value.toFixed(1)}</span
							>
						</div>
					{/if}
				{/each}
			</div>
		{/if}

		<!-- Description -->
		{#if product.productDescription}
			<p class="text-sm text-muted-foreground leading-relaxed">
				{product.productDescription}
			</p>
		{/if}

		<!-- Used in recipes — gated on the fetched total, capped; full list lives in the catalog -->
		{#if recipesLoading || recipeTotal > 0}
			<div class="glass-surface p-3 space-y-2">
				{#if recipesLoading && recipes.length === 0}
					<div class="h-3 w-28 rounded bg-muted animate-pulse"></div>
					<div class="space-y-2">
						{#each Array(Math.min(recipeCount || 3, 4)) as _}
							<div class="flex items-center gap-3">
								<div class="h-10 w-10 shrink-0 rounded-md bg-muted animate-pulse"></div>
								<div class="h-3 flex-1 rounded bg-muted animate-pulse"></div>
							</div>
						{/each}
					</div>
				{:else}
					<h3 class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
						Used in {recipeTotal} recipe{recipeTotal !== 1 ? 's' : ''}
					</h3>
					{#each recipes as recipe (recipe.recipeId)}
						<a
							href="/catalog/{recipe.recipeId}"
							class="focus-ring flex items-center gap-3 rounded-lg p-1.5 -mx-1.5 transition-colors hover:bg-white/5"
						>
							<div class="h-10 w-10 shrink-0 overflow-hidden rounded-md">
								<SkeletonImage
									src={recipe.recipeImageUrl}
									alt={recipe.recipeName}
									variant="recipe"
									class="h-full w-full"
								/>
							</div>
							<span class="min-w-0 flex-1 truncate text-sm font-medium">{recipe.recipeName}</span>
							<ChevronRight class="h-4 w-4 shrink-0 text-muted-foreground" />
						</a>
					{/each}
					{#if recipeTotal > recipes.length}
						<a
							href="/catalog?ingredientInclude={product.productId}"
							class="inline-flex items-center rounded-sm pt-1 text-sm font-medium text-primary hover:underline focus-visible:underline focus-visible:outline-none"
						>
							Show all {recipeTotal} recipes <ChevronRight class="ml-0.5 h-3.5 w-3.5" />
						</a>
					{/if}
				{/if}
			</div>
		{/if}

		<!-- Actions -->
		{#if canModify}
			<div class="space-y-3 pt-3 border-t border-white/10">
				{#if onStockChange && showStock}
					<div class="flex items-center gap-2.5">
						<Switch
							id="stock-toggle-{product.productId}"
							checked={product.productInStockQuantity > 0}
							onCheckedChange={handleStockToggle}
						/>
						<Label for="stock-toggle-{product.productId}" class="text-sm cursor-pointer">
							In Stock
						</Label>
					</div>
				{/if}
				<div class="flex items-center gap-2">
					{#if onDelete}
						<Button variant="destructive" size="sm" class="flex-1" onclick={() => onDelete?.()}>
							<Trash2 class="w-3.5 h-3.5 mr-1.5" />
							Delete
						</Button>
					{/if}
					<Button
						variant="default"
						size="sm"
						class="flex-1"
						href="/inventory/{product.productId}/edit"
					>
						<Pencil class="w-3.5 h-3.5 mr-1.5" />
						Edit
					</Button>
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="flex items-center justify-center h-32 text-muted-foreground">No product data</div>
{/if}
