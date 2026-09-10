<script lang="ts">
	import {
		ChefHat,
		DollarSign,
		Droplets,
		Expand,
		FlaskConical,
		GlassWater,
		Info,
		Martini,
		Percent,
		X,
	} from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';

	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import { cdnSrc } from '$lib/utils/image';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { calculateAbv, getDilutionInfo } from '$lib/math';
	import { cn } from '$lib/utils';
	import type { View } from '$lib/types';
	import { roleCanModify, type WorkspaceWithRole } from '$lib/types/workspace';
	import type { RecipeInsightLinks, RecipeInsightsOutput } from '$lib/types/generators';

	import RecipeDetailSheet from './RecipeDetailSheet.svelte';
	import RecipeIngredientStep from './RecipeIngredientStep.svelte';
	import RecipeInsights from './RecipeInsights.svelte';
	import RecipeVerdictCard from './RecipeVerdictCard.svelte';

	// Props using $props()
	import type { Snippet } from 'svelte';
	import type { StepExtras } from '$lib/types';

	let {
		recipe,
		recipeSteps: initialRecipeSteps,
		stepExtras,
		actions,
		imageActions,
	}: {
		recipe: View.BasicRecipe;
		recipeSteps: View.BasicRecipeStep[];
		stepExtras?: StepExtras[];
		actions?: Snippet;
		imageActions?: Snippet;
	} = $props();

	// resolve per-step image/substitute data by step id (absent in preview contexts)
	const extrasByStep = $derived(new Map((stepExtras ?? []).map((e) => [e.recipeStepId, e])));

	// get workspace role for permission checks
	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = roleCanModify(workspace?.workspaceRole);

	let content: RecipeInsightsOutput | null = $state(null);
	let links: RecipeInsightLinks | null = $state(null);
	let contentLoading = $state(true);
	let contentCached = $state(false);
	let regenerating = $state(false);

	// steps with checked state
	let steps = $derived(initialRecipeSteps.map((step) => ({ ...step, checked: false })));

	// Lightbox state (desktop) + details sheet state (mobile)
	let lightboxOpen = $state(false);
	let detailSheetOpen = $state(false);
	let isMobile = $state(false);

	onMount(() => {
		const mq = window.matchMedia('(max-width: 767px)');
		isMobile = mq.matches;
		const handler = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mq.addEventListener('change', handler);
		return () => mq.removeEventListener('change', handler);
	});

	// used initialize before render and reset when steps change
	let completed: boolean[] = $state([]);
	$effect.pre(() => {
		if (completed.length !== initialRecipeSteps.length) {
			completed = Array(initialRecipeSteps.length).fill(false);
		}
	});

	// derived values
	let abv = $derived(calculateAbv(initialRecipeSteps, recipe.recipeTechniqueDescriptionId || 1));
	let ingredientCount = $derived(initialRecipeSteps.length);
	let completedSteps = $derived(completed.filter((c) => c).length);
	let allStepsCompleted = $derived(completedSteps === steps.length && steps.length > 0);

	// dilution and volume calculations
	let dilutionInfo = $derived(
		getDilutionInfo(initialRecipeSteps, recipe.recipeTechniqueDescriptionId || 1)
	);
	// let dilutionMethod = $derived(getMethodFromTechniqueId(recipe.recipeTechniqueDescriptionId || 1));
	let preVolumeMl = $derived(dilutionInfo.volumeMl);
	let preVolumeOz = $derived((preVolumeMl / 30).toFixed(1));
	// let dilutionMl = $derived(dilutionInfo.dilutionMl);
	let dilutionOz = $derived(dilutionInfo.dilutionOz.toFixed(1));
	let finalVolumeMl = $derived(dilutionInfo.finalVolumeMl);
	let finalVolumeOz = $derived((finalVolumeMl / 30).toFixed(1));

	// estimated cost calculation
	let estimatedCost = $derived(
		initialRecipeSteps.reduce((acc, step) => {
			if (step.productUnitSizeInMilliliters > 0 && step.productPricePerUnit > 0) {
				const costPerMl = step.productPricePerUnit / step.productUnitSizeInMilliliters;
				return acc + step.productIdQuantityInMilliliters * costPerMl;
			}
			return acc;
		}, 0)
	);

	const servingMethodIcons: Record<string, typeof Martini> = {
		Stirred: Martini,
		Shaken: GlassWater,
		Built: FlaskConical,
	};
	let ServingIcon = $derived(
		servingMethodIcons[recipe.recipeTechniqueDescriptionText || ''] || GlassWater
	);

	async function fetchInsights(regenerate = false) {
		try {
			const result = await fetch(`/api/generator/recipe`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					trigger: recipe.recipeName,
					recipeId: recipe.recipeId,
					regenerate,
				}),
			});
			const response = await result.json();
			content = response;
			links = response.links ?? null;
			contentCached = response.cached ?? false;
		} catch (e) {
			console.error('Failed to load recipe insights:', e);
		}
	}

	// fetch generator content (only for authenticated editors/owners)
	onMount(async () => {
		if (!recipe.insightsEnabled || !canModify) {
			contentLoading = false;
			return;
		}
		await fetchInsights();
		contentLoading = false;
	});

	async function regenerateInsights() {
		regenerating = true;
		await fetchInsights(true);
		regenerating = false;
	}

	// mobile taps open the details sheet; desktop keeps the lightbox
	function handleImageClick() {
		if (!recipe.recipeImageUrl) return;
		if (isMobile) detailSheetOpen = true;
		else openLightbox();
	}

	function openLightbox() {
		if (!recipe.recipeImageUrl) return;
		lightboxOpen = true;
		// stops body scroll when lightbox is open
		document.body.style.overflow = 'hidden';
	}

	function closeLightbox() {
		lightboxOpen = false;
		document.body.style.overflow = '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && lightboxOpen) {
			closeLightbox();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<section class="antialiased">
	<!-- Mobile toolbar above the image: back + more -->
	{#if imageActions}
		<div class="md:hidden flex items-center justify-between mb-3">
			{@render imageActions()}
		</div>
	{/if}

	<!-- Hero Section -->
	<div class="relative rounded-xl overflow-hidden mb-6">
		<!-- Background Image (clickable area) -->
		{#if recipe.recipeImageUrl}
			<button
				type="button"
				class="absolute inset-0 w-full cursor-zoom-in group"
				onclick={handleImageClick}
				aria-label="View recipe details"
			>
				<SkeletonImage
					src={recipe.recipeImageUrl}
					alt={recipe.recipeName}
					variant="recipe"
					class="h-full w-full"
					imgClass="transition-transform duration-300 group-hover:scale-105"
					sizes="(max-width: 768px) 100vw, 720px"
				/>
				<!-- Gradient overlay -->
				<div
					class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"
				></div>

				<!-- Expand indicator (desktop lightbox) -->
				<div
					class="hidden md:block absolute top-4 right-4 p-2 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-md backdrop-saturate-150 border border-white/40 dark:border-white/20 text-neutral-800 dark:text-white hover:!text-white shadow-lg hover:!bg-black/80 hover:!border-black/80 hover:!backdrop-blur-none active:!bg-black transition-all duration-200"
				>
					<Expand class="w-5 h-5 drop-shadow" />
				</div>

				<!-- Tap-for-details hint (mobile) -->
				<div
					class="md:hidden absolute top-4 left-1/2 -translate-x-1/2 p-2 rounded-full glass-overlay-control shadow-lg pointer-events-none"
				>
					<Info class="w-5 h-5 drop-shadow" />
				</div>
			</button>
		{:else}
			<div class="absolute inset-0 w-full">
				<SkeletonImage src={null} alt={recipe.recipeName} variant="recipe" class="h-full w-full" />
				<div
					class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"
				></div>
			</div>
		{/if}

		<!-- Hero Content -->
		<div class="relative pt-48 pb-6 px-4 md:px-6 pointer-events-none">
			<!-- Desktop: title + badges -->
			<div class="hidden md:flex items-end justify-between gap-4">
				<div>
					<Badge size="lg" variant="secondary" class="mb-3 !text-sm pointer-events-auto">
						{recipe.recipeCategoryDescription}
					</Badge>
					<h1 class="text-3xl md:text-4xl font-bold text-foreground mb-2">
						{recipe.recipeName}
					</h1>
				</div>
				<div class="flex flex-wrap items-center gap-2 pointer-events-auto justify-end">
					<Badge size="lg" class="!py-1 !px-3 !text-xs !gap-1.5">
						<Percent class="h-3.5 w-3.5" />
						{abv}
					</Badge>
					<Badge size="lg" class="!py-1 !px-3 !text-xs !gap-1.5">
						<ServingIcon class="h-3.5 w-3.5" />
						{recipe.recipeTechniqueDescriptionText}
					</Badge>
					<Badge size="lg" class="!py-1 !px-3 !text-xs !gap-1.5">
						<FlaskConical class="h-3.5 w-3.5" />
						{ingredientCount} ingredients
					</Badge>
				</div>
			</div>

			<!-- Mobile: title only (category + actions live below/around the image) -->
			<div class="md:hidden">
				<h1 class="text-3xl font-bold text-foreground mb-2">
					{recipe.recipeName}
				</h1>
			</div>
		</div>
	</div>

	<!-- Mobile: favorite + feature below the image -->
	{#if actions}
		<div class="md:hidden mb-6">
			{@render actions()}
		</div>
	{/if}

	<!-- Lightbox Overlay -->
	{#if lightboxOpen && recipe.recipeImageUrl}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center"
			role="dialog"
			aria-modal="true"
			aria-label="Image lightbox"
		>
			<!-- Backdrop -->
			<button
				type="button"
				class="absolute inset-0 bg-background/95 backdrop-blur-md backdrop-saturate-150 cursor-zoom-out"
				onclick={closeLightbox}
				aria-label="Close lightbox"
				transition:fade={{ duration: 200 }}
			></button>

			<!-- Close button -->
			<button
				type="button"
				class="absolute top-4 right-4 z-10 p-3 rounded-full bg-muted/50 hover:bg-muted text-foreground transition-colors"
				onclick={closeLightbox}
				aria-label="Close"
				transition:fade={{ duration: 200, delay: 100 }}
			>
				<X class="w-6 h-6" />
			</button>

			<!-- Image container -->
			<div
				class="relative max-w-[90vw] max-h-[85vh] cursor-zoom-out"
				transition:scale={{ duration: 300, easing: cubicOut, start: 0.9 }}
			>
				<button type="button" onclick={closeLightbox} class="block" aria-label="Close lightbox">
					<img
						class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
						src={cdnSrc(recipe.recipeImageUrl, 1600, { fit: 'scale-down' })}
						alt={recipe.recipeName}
					/>
				</button>

				<!-- Image caption -->
				<div
					class="absolute -bottom-12 left-0 right-0 text-center"
					transition:fade={{ duration: 200, delay: 150 }}
				>
					<p class="text-foreground font-semibold text-lg">{recipe.recipeName}</p>
					<p class="text-muted-foreground text-sm">{recipe.recipeCategoryDescription}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Row 1: Ingredients + Verdict -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
		<!-- Ingredients Card -->
		<Card.Root class="lg:col-span-2">
			<Card.Header class="pb-3">
				<div class="flex items-center justify-between">
					<Card.Title class="flex items-center gap-2 text-lg">
						<ChefHat class="h-5 w-5 text-primary" />
						Ingredients
					</Card.Title>
					{#if steps.length > 0}
						<Badge variant={allStepsCompleted ? 'default' : 'secondary'} class="transition-all">
							{completedSteps} / {steps.length}
						</Badge>
					{/if}
				</div>
			</Card.Header>
			<Card.Content>
				{#if steps.length === 0}
					<p class="text-muted-foreground text-center py-8">
						No ingredients listed for this recipe.
					</p>
				{:else}
					<div class="space-y-1">
						{#each steps as step, index (step.recipeStepId ?? index)}
							{@const extras = extrasByStep.get(step.recipeStepId ?? -1)}
							<RecipeIngredientStep
								categoryName={step.categoryName}
								productName={step.productName}
								quantity={step.productIdQuantityInMilliliters}
								unit={step.productIdQuantityUnit}
								description={step.recipeStepDescription}
								productImageUrl={extras?.productImageUrl ?? null}
								matchLabel={extras?.matchLabel ?? null}
								substitutes={extras?.substitutes ?? []}
								bind:checked={completed[index]}
							/>
						{/each}
					</div>

					{#if allStepsCompleted}
						<div class="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
							<p class="text-primary font-medium">
								All ingredients ready! Time to mix your cocktail.
							</p>
						</div>
					{/if}
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Verdict Card (sticky on desktop, offset to clear the nav; mobile shows it in the details sheet) -->
		<div class="hidden md:block lg:col-span-1 lg:sticky lg:top-20 lg:self-start">
			<RecipeVerdictCard {recipe} recipeSteps={initialRecipeSteps} />
		</div>
	</div>

	<!-- Row 2: Description (if exists) -->
	{#if recipe.recipeDescription}
		<Card.Root class="mb-6">
			<Card.Content class="pt-6">
				<p class="text-muted-foreground leading-relaxed">
					{recipe.recipeDescription}
				</p>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Row 3: Preparation, Volume & Dilution, Cost Estimate -->
	<div
		class={cn(
			'grid grid-cols-1 gap-6 mb-6',
			estimatedCost > 0 ? 'md:grid-cols-3' : 'md:grid-cols-2'
		)}
	>
		<!-- Preparation card -->
		<Card.Root>
			<Card.Header class="pb-3">
				<Card.Title class="flex items-center gap-2 text-base">
					<GlassWater class="h-5 w-5 text-primary" />
					Preparation
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Method</span>
					<Badge variant="secondary">{recipe.recipeTechniqueDescriptionText}</Badge>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Base Spirit</span>
					<Badge variant="outline">{recipe.recipeCategoryDescription}</Badge>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Volume & Dilution card -->
		<Card.Root>
			<Card.Header class="pb-3">
				<Card.Title class="flex items-center gap-2 text-base">
					<Droplets class="h-5 w-5 text-primary" />
					Volume & Dilution
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Pre-dilution</span>
					<span class="text-sm font-medium">{preVolumeOz} oz</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">Water added</span>
					<span class="text-sm font-medium text-blue-500">+{dilutionOz} oz</span>
				</div>
				<div class="flex items-center justify-between border-t pt-3">
					<span class="text-sm font-medium">Final volume</span>
					<span class="text-sm font-bold">{finalVolumeOz} oz</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-sm text-muted-foreground">ABV</span>
					<Badge variant="outline">{abv}</Badge>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Cost Estimate card — hidden entirely when no cost data (rather than showing an empty state) -->
		{#if estimatedCost > 0}
			<Card.Root>
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-base">
						<DollarSign class="h-5 w-5 text-primary" />
						Cost Estimate
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Per drink</span>
						<span class="text-sm font-bold">${estimatedCost.toFixed(2)}</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Cost per oz</span>
						<span class="text-sm font-medium"
							>${(estimatedCost / parseFloat(finalVolumeOz)).toFixed(2)}</span
						>
					</div>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>

	<!-- Row 4: Cocktail Insights -->
	{#if recipe.insightsEnabled && canModify}
		<RecipeInsights
			{content}
			{links}
			loading={contentLoading}
			cached={contentCached}
			{regenerating}
			onregenerate={regenerateInsights}
		/>
	{/if}
</section>

<!-- Mobile details sheet (image, badges, verdict) -->
<RecipeDetailSheet
	bind:open={detailSheetOpen}
	{recipe}
	recipeSteps={initialRecipeSteps}
	{abv}
	{ingredientCount}
	{ServingIcon}
/>
