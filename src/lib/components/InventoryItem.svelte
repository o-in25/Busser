<script lang="ts">
	import {
		AlertTriangle,
		ArrowRight,
		Beaker,
		Calculator,
		Candy,
		CheckCircle2,
		DollarSign,
		Flame,
		FlaskConical,
		Info,
		Pencil,
		Sparkles,
		Wind,
		XCircle,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';

	import ImagePlaceholder from '$lib/components/ImagePlaceholder.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { Switch } from '$lib/components/ui/switch';
	import { weightedMean } from '$lib/math';
	import type { Product } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		product,
		isBaseSpirit,
		recipeCount = 0,
		onStockChange = null,
	}: {
		product: Product;
		isBaseSpirit: boolean;
		recipeCount?: number;
		onStockChange?: ((productId: number, inStock: boolean) => void) | null;
	} = $props();

	// get workspace role for permission checks
	const workspace = getContext<{ workspaceRole?: string }>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	// Image state
	let imageError = $state(false);
	let hasImage = $derived(!!product?.productImageUrl && !imageError);

	// Calculated fields
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

	// Stock status
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
		if (product.productInStockQuantity === 1) {
			return {
				label: 'Low Stock',
				variant: 'secondary' as const,
				icon: AlertTriangle,
				color: 'text-yellow-500',
				bgColor: 'bg-yellow-500/10',
			};
		}
		return {
			label: 'In Stock',
			variant: 'default' as const,
			icon: CheckCircle2,
			color: 'text-green-500',
			bgColor: 'bg-green-500/10',
		};
	});

	const StockIcon = $derived(stockStatus.icon);

	// Flavor profile data
	const flavorProfile = $derived([
		{
			label: 'Sweetness',
			value: product.productSweetnessRating || 0,
			icon: Candy,
			color: 'bg-pink-500',
		},
		{
			label: 'Dryness',
			value: product.productDrynessRating || 0,
			icon: Wind,
			color: 'bg-amber-500',
		},
		{
			label: 'Versatility',
			value: product.productVersatilityRating || 0,
			icon: Sparkles,
			color: 'bg-purple-500',
		},
		{
			label: 'Strength',
			value: product.productStrengthRating || 0,
			icon: Flame,
			color: 'bg-orange-500',
		},
	]);

	// Check if flavor profile has any data
	const hasFlavorProfile = $derived(flavorProfile.some((f) => f.value > 0));

	// Overall rating calculation
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
			score: vec.toFixed(1),
			label: desc2,
			style,
		};
	};

	const overallRating = generateRatings();

	// Handle stock toggle
	function handleStockToggle(checked: boolean) {
		if (onStockChange && product.productId) {
			onStockChange(product.productId, checked);
		}
	}
</script>

{#if product}
	<div class="space-y-6">
		<!-- Hero Image -->
		<div class="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-muted">
			{#if hasImage}
				<img
					src={product.productImageUrl}
					alt={product.productName}
					class="w-full h-full object-cover"
					onerror={() => (imageError = true)}
				/>
			{:else}
				<ImagePlaceholder variant="product" class="w-20 h-20" />
			{/if}
			{#if isBaseSpirit && hasFlavorProfile}
				<div class="absolute bottom-3 right-3">
					<span
						class="text-sm font-bold px-3 py-1.5 rounded-lg text-white shadow-lg {overallRating.style}"
					>
						{overallRating.score} · {overallRating.label}
					</span>
				</div>
			{/if}
		</div>

		<!-- Header -->
		<div>
			<h2 class="text-2xl font-bold text-foreground mb-2">
				{product.productName}
			</h2>
			<div class="flex items-center gap-2 flex-wrap">
				<Popover.Root>
					<Popover.Trigger
						class="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						{product.categoryName}
						<Info class="w-3.5 h-3.5 ml-1" />
					</Popover.Trigger>
					<Popover.Content
						class="w-72"
						side="bottom"
						align="start"
						avoidCollisions={true}
						collisionPadding={16}
					>
						<div class="space-y-2">
							<h4 class="font-medium">{product.categoryName}</h4>
							<p class="text-sm text-muted-foreground">{product.categoryDescription}</p>
							<a
								href="/inventory/category/{product.categoryId}/edit"
								class="inline-flex items-center text-sm font-medium text-primary hover:underline"
							>
								Edit Category <ArrowRight class="ml-1 h-3 w-3" />
							</a>
						</div>
					</Popover.Content>
				</Popover.Root>
				{#if isBaseSpirit}
					<Badge variant="secondary" class="text-xs">Base Spirit</Badge>
				{/if}
			</div>
		</div>

		<!-- Status Badges -->
		<div class="flex items-center gap-2 flex-wrap">
			<Badge variant={stockStatus.variant} class="gap-1.5 {stockStatus.bgColor}">
				<StockIcon class="h-3.5 w-3.5 {stockStatus.color}" />
				{stockStatus.label}
			</Badge>
			{#if recipeCount > 0}
				<a href="/catalog/browse?ingredient={product.productId}">
					<Badge variant="outline" class="gap-1.5 hover:bg-accent transition-colors cursor-pointer">
						<FlaskConical class="h-3.5 w-3.5" />
						Used in {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}
					</Badge>
				</a>
			{/if}
		</div>

		<!-- Quick Stats Grid -->
		<div class="grid grid-cols-2 gap-3">
			{#if product.productPricePerUnit}
				<div class="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
					<DollarSign class="h-5 w-5 text-green-500 shrink-0" />
					<div>
						<p class="text-xs text-muted-foreground">Price</p>
						<p class="font-semibold">${product.productPricePerUnit.toFixed(2)}</p>
					</div>
				</div>
			{/if}
			{#if product.productUnitSizeInMilliliters}
				<div class="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
					<Beaker class="h-5 w-5 text-blue-500 shrink-0" />
					<div>
						<p class="text-xs text-muted-foreground">Size</p>
						<p class="font-semibold">{product.productUnitSizeInMilliliters}mL</p>
					</div>
				</div>
			{/if}
			{#if product.productProof}
				<div class="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
					<Flame class="h-5 w-5 text-orange-500 shrink-0" />
					<div>
						<p class="text-xs text-muted-foreground">Proof / ABV</p>
						<p class="font-semibold">
							{product.productProof}° {#if abvPercent}<span
									class="text-muted-foreground font-normal">({abvPercent}%)</span
								>{/if}
						</p>
					</div>
				</div>
			{/if}
			{#if pricePerOunce}
				<div class="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
					<Calculator class="h-5 w-5 text-purple-500 shrink-0" />
					<div>
						<p class="text-xs text-muted-foreground">Price/oz</p>
						<p class="font-semibold">${pricePerOunce}</p>
					</div>
				</div>
			{/if}
		</div>

		<!-- Flavor Profile -->
		{#if hasFlavorProfile}
			<div class="space-y-3">
				<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					Flavor Profile
				</h3>
				<div class="space-y-2">
					{#each flavorProfile as flavor}
						{#if flavor.value > 0}
							{@const FlavorIcon = flavor.icon}
							<div class="flex items-center gap-3">
								<FlavorIcon class="h-4 w-4 text-muted-foreground shrink-0" />
								<span class="text-sm w-20 shrink-0">{flavor.label}</span>
								<div class="flex-1 h-2 bg-muted rounded-full overflow-hidden">
									<div
										class="h-full {flavor.color} transition-all"
										style="width: {(flavor.value / 10) * 100}%"
									></div>
								</div>
								<span class="text-sm font-medium w-8 text-right">{flavor.value.toFixed(1)}</span>
							</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}

		<!-- Description -->
		{#if product.productDescription}
			<div class="space-y-2">
				<h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
					Description
				</h3>
				<p class="text-sm text-muted-foreground leading-relaxed">
					{product.productDescription}
				</p>
			</div>
		{/if}

		<!-- Actions -->
		<div class="flex items-center justify-between pt-4 border-t">
			{#if canModify && onStockChange}
				<div class="flex items-center gap-3">
					<Switch
						id="stock-toggle-{product.productId}"
						checked={product.productInStockQuantity > 0}
						onCheckedChange={handleStockToggle}
					/>
					<Label for="stock-toggle-{product.productId}" class="text-sm cursor-pointer">
						In Stock
					</Label>
				</div>
			{:else}
				<div></div>
			{/if}
			{#if canModify}
				<a
					class={cn(buttonVariants({ variant: 'default' }))}
					href="/inventory/{product.productId}/edit"
				>
					<Pencil class="w-4 h-4 mr-2" />
					Edit Product
				</a>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center h-32 bg-muted rounded-lg">
		<span class="text-muted-foreground">No product data</span>
	</div>
{/if}
