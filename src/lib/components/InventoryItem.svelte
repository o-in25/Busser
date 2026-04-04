<script lang="ts">
	import {
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

	import FancyBadge from '$lib/components/FancyBadge.svelte';
	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import * as Popover from '$lib/components/ui/popover';
	import { Switch } from '$lib/components/ui/switch';
	import { weightedMean } from '$lib/math';
	import type { Product } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		product,
		recipeCount = 0,
		showStock = true,
		onStockChange = null,
	}: {
		product: Product;
		recipeCount?: number;
		showStock?: boolean;
		onStockChange?: ((productId: number, inStock: boolean) => void) | null;
	} = $props();

	// get workspace role for permission checks
	const workspace = getContext<{ workspaceRole?: string }>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

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
		return {
			label: 'In Stock',
			variant: 'default' as const,
			icon: CheckCircle2,
			color: 'text-neon-green-500',
			bgColor: 'bg-neon-green-500/10',
		};
	});

	const StockIcon = $derived(stockStatus.icon);

	// Flavor profile data
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

	// only show flavor profile for spirits (CategoryGroupId 1) with data
	const hasFlavorProfile = $derived(
		product.categoryGroupId === 1 && flavorProfile.some((f) => f.value > 0)
	);

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

	// Handle stock toggle
	function handleStockToggle(checked: boolean) {
		if (onStockChange && product.productId) {
			onStockChange(product.productId, checked);
		}
	}
</script>

{#if product}
	<div class="space-y-4">
		<!-- Hero: image with name, category, and rating overlaid -->
		<div class="relative rounded-xl overflow-hidden">
			<div class="aspect-[3/2] w-full">
				<SkeletonImage
					src={product.productImageUrl}
					alt={product.productName}
					variant="product"
					class="h-full w-full"
				/>
			</div>
			<div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>

			<!-- Name + category over image -->
			<div class="absolute inset-x-0 bottom-0 p-4">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<h2 class="text-xl font-bold text-foreground leading-tight">
							{product.productName}
						</h2>
						<div class="flex items-center gap-2 mt-1.5 flex-wrap">
							<Popover.Root>
								<Popover.Trigger
									class="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{product.categoryName}
									<Info class="w-3 h-3 ml-1" />
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
							{#if product.categoryGroupName}
								<span class="text-xs text-muted-foreground/50">&middot;</span>
								<span class="text-sm text-muted-foreground">{product.categoryGroupName}</span>
							{/if}
						</div>
					</div>

					<!-- Rating pill -->
					{#if hasFlavorProfile}
						<span
							class="shrink-0 flex flex-col items-center px-2.5 py-1.5 rounded-xl text-white shadow-lg {overallRating.style}"
						>
							<span class="text-[9px] font-semibold uppercase tracking-wider opacity-80 leading-none">verdict</span>
							<span class="text-lg font-bold leading-tight">{overallRating.score}</span>
							<span class="text-[10px] opacity-80 leading-none">{overallRating.label}</span>
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Status + recipe count row -->
		<div class="flex items-center gap-2 flex-wrap">
			{#if showStock}
				<FancyBadge variant={product.productInStockQuantity > 0 ? 'default' : 'danger'}>
					<StockIcon class="h-3.5 w-3.5 {stockStatus.color}" />
					<span class="text-xs">{stockStatus.label}</span>
				</FancyBadge>
			{/if}
			{#if recipeCount > 0}
				<FancyBadge href="/catalog/browse?ingredientInclude={product.productId}">
					<FlaskConical class="h-3.5 w-3.5 text-primary" />
					<span class="text-xs text-muted-foreground">Used in {recipeCount} recipe{recipeCount !== 1 ? 's' : ''}</span>
				</FancyBadge>
			{/if}
		</div>

		<!-- Quick stats — compact inline pills -->
		<div class="flex flex-wrap gap-2">
			{#if product.productPricePerUnit}
				<FancyBadge>
					<DollarSign class="h-3.5 w-3.5 text-neon-green-500" />
					<span class="text-xs font-semibold">${product.productPricePerUnit.toFixed(2)}</span>
				</FancyBadge>
			{/if}
			{#if product.productUnitSizeInMilliliters}
				<FancyBadge>
					<Beaker class="h-3.5 w-3.5 text-blue-500" />
					<span class="text-xs font-semibold">{product.productUnitSizeInMilliliters}mL</span>
				</FancyBadge>
			{/if}
			{#if product.productProof}
				<FancyBadge>
					<Flame class="h-3.5 w-3.5 text-neon-amber-500" />
					<span class="text-xs font-semibold">
						{product.productProof}° {#if abvPercent}<span class="font-normal text-muted-foreground">({abvPercent}%)</span>{/if}
					</span>
				</FancyBadge>
			{/if}
			{#if pricePerOunce}
				<FancyBadge>
					<Calculator class="h-3.5 w-3.5 text-secondary-500" />
					<span class="text-xs font-semibold">${pricePerOunce}/oz</span>
				</FancyBadge>
			{/if}
		</div>

		<!-- Flavor Profile -->
		{#if hasFlavorProfile}
			<div class="rounded-xl bg-white/50 dark:bg-white/[0.04] backdrop-blur-sm border border-white/20 dark:border-white/10 p-3 space-y-2.5">
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
							<span class="text-xs font-medium w-7 text-right text-muted-foreground">{flavor.value.toFixed(1)}</span>
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

		<!-- Actions -->
		<div class="flex items-center justify-between pt-3 border-t border-white/10">
			{#if canModify && onStockChange && showStock}
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
			{:else}
				<div></div>
			{/if}
			{#if canModify}
				<a
					class={cn(buttonVariants({ variant: 'default', size: 'sm' }))}
					href="/inventory/{product.productId}/edit"
				>
					<Pencil class="w-3.5 h-3.5 mr-1.5" />
					Edit
				</a>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex items-center justify-center h-32 text-muted-foreground">
		No product data
	</div>
{/if}
