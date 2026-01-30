<script lang="ts">
	import {
		BookOpen,
		ChefHat,
		Expand,
		FlaskConical,
		GlassWater,
		Martini,
		Pencil,
		Percent,
		X,
	} from 'lucide-svelte';
	import { getContext, onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';

	import placeholderDark from '$lib/assets/placeholder-alt-dark.png';
	import placeholderLight from '$lib/assets/placeholder-alt-light.png';
	import { Badge } from '$lib/components/ui/badge';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { CollapsibleSection } from '$lib/components/ui/collapsible';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { calculateAbv } from '$lib/math';
	import type { RecipeGeneratorSchema } from '$lib/server/generators/recipe-generator';
	import type { View } from '$lib/types';
	import { cn } from '$lib/utils';

	import RecipeIngredientStep from './RecipeIngredientStep.svelte';
	import RecipeVerdictCard from './RecipeVerdictCard.svelte';

	// Props using $props()
	let {
		recipe,
		recipeSteps: initialRecipeSteps,
	}: {
		recipe: View.BasicRecipe;
		recipeSteps: View.BasicRecipeStep[];
	} = $props();

	// get workspace role for permission checks
	const workspace = getContext<{ workspaceRole?: string }>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	// AI-generated content
	let content: RecipeGeneratorSchema | null = $state(null);
	let contentLoading = $state(true);

	// Steps with checked state
	let steps = $state(initialRecipeSteps.map((step) => ({ ...step, checked: false })));

	// Lightbox state
	let lightboxOpen = $state(false);

	// Calculate derived values
	let abv = $derived(calculateAbv(initialRecipeSteps, recipe.recipeTechniqueDescriptionId || 1));
	let ingredientCount = $derived(initialRecipeSteps.length);
	let completedSteps = $derived(steps.filter((s) => s.checked).length);
	let allStepsCompleted = $derived(completedSteps === steps.length && steps.length > 0);

	// Get the actual image URL
	let lightImageUrl = $derived(recipe.recipeImageUrl || placeholderLight);
	let darkImageUrl = $derived(recipe.recipeImageUrl || placeholderDark);

	// Serving method icon mapping
	const servingMethodIcons: Record<string, typeof Martini> = {
		Stirred: Martini,
		Shaken: GlassWater,
		Built: FlaskConical,
	};
	const ServingIcon = servingMethodIcons[recipe.recipeTechniqueDescriptionText || ''] || GlassWater;

	// Fetch AI-generated content
	onMount(async () => {
		try {
			const result = await fetch(`/api/generator/recipe`, {
				method: 'POST',
				body: JSON.stringify({ recipeName: recipe.recipeName }),
			});
			const response = await result.json();
			content = response;
		} catch (e) {
			console.error('Failed to load recipe history:', e);
		} finally {
			contentLoading = false;
		}
	});

	function toggleStep(index: number) {
		steps[index].checked = !steps[index].checked;
	}

	function openLightbox() {
		lightboxOpen = true;
		// Prevent body scroll when lightbox is open
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
	<!-- Hero Section -->
	<div class="relative rounded-xl overflow-hidden mb-6">
		<!-- Background Image (clickable area) -->
		<button
			type="button"
			class="absolute inset-0 w-full cursor-zoom-in group"
			onclick={openLightbox}
			aria-label="View full image"
		>
			<img
				class="w-full h-full object-cover dark:hidden transition-transform duration-300 group-hover:scale-105"
				src={lightImageUrl}
				alt={recipe.recipeName}
			/>
			<img
				class="w-full h-full object-cover hidden dark:block transition-transform duration-300 group-hover:scale-105"
				src={darkImageUrl}
				alt={recipe.recipeName}
			/>
			<!-- Gradient overlay -->
			<div
				class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"
			></div>

			<!-- Expand indicator -->
			<div
				class="absolute top-4 right-4 p-2 rounded-full bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
			>
				<Expand class="w-5 h-5 text-foreground" />
			</div>
		</button>

		<!-- Hero Content -->
		<div class="relative pt-48 pb-6 px-4 md:px-6 pointer-events-none">
			<div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
				<div>
					<!-- Category badge -->
					<Badge variant="secondary" class="mb-3 text-sm pointer-events-auto">
						{recipe.recipeCategoryDescription}
					</Badge>

					<!-- Recipe name -->
					<h1 class="text-3xl md:text-4xl font-bold text-foreground mb-2">
						{recipe.recipeName}
					</h1>

					<!-- Quick stats -->
					<div class="flex flex-wrap items-center gap-2 mt-3 pointer-events-auto">
						<Badge variant="outline" class="flex items-center gap-1.5">
							<Percent class="h-3.5 w-3.5" />
							{abv}
						</Badge>
						<Badge variant="outline" class="flex items-center gap-1.5">
							<ServingIcon class="h-3.5 w-3.5" />
							{recipe.recipeTechniqueDescriptionText}
						</Badge>
						<Badge variant="outline" class="flex items-center gap-1.5">
							<FlaskConical class="h-3.5 w-3.5" />
							{ingredientCount} ingredients
						</Badge>
					</div>
				</div>

				<!-- Edit button -->
				{#if canModify}
					<a
						class={cn(buttonVariants({ variant: 'default' }), 'shrink-0 pointer-events-auto')}
						href="/catalog/{recipe.recipeId}/edit"
					>
						<Pencil class="w-4 h-4 mr-2" />
						Edit Recipe
					</a>
				{/if}
			</div>
		</div>
	</div>

	<!-- Lightbox Overlay -->
	{#if lightboxOpen}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center"
			role="dialog"
			aria-modal="true"
			aria-label="Image lightbox"
		>
			<!-- Backdrop -->
			<button
				type="button"
				class="absolute inset-0 bg-background/95 backdrop-blur-md cursor-zoom-out"
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
						class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl dark:hidden"
						src={lightImageUrl}
						alt={recipe.recipeName}
					/>
					<img
						class="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl hidden dark:block"
						src={darkImageUrl}
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

	<!-- Description if exists -->
	{#if recipe.recipeDescription}
		<Card.Root class="mb-6">
			<Card.Content class="pt-6">
				<p class="text-muted-foreground leading-relaxed">
					{recipe.recipeDescription}
				</p>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Main Content Grid -->
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Left Column: Ingredients -->
		<div class="lg:col-span-2 space-y-6">
			<!-- Ingredients Card -->
			<Card.Root>
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
						<div class="space-y-2">
							{#each steps as step, index}
								<RecipeIngredientStep
									stepNumber={index + 1}
									categoryName={step.categoryName}
									productName={step.productName}
									quantity={step.productIdQuantityInMilliliters}
									unit={step.productIdQuantityUnit}
									description={step.recipeStepDescription}
									bind:checked={step.checked}
									ontoggle={() => toggleStep(index)}
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

			<!-- About/History Section -->
			<CollapsibleSection title="About This Cocktail" icon={BookOpen} open={true}>
				{#if contentLoading}
					<div class="space-y-3">
						<Skeleton class="h-4 w-full" />
						<Skeleton class="h-4 w-full" />
						<Skeleton class="h-4 w-3/4" />
					</div>
				{:else if content?.description}
					<p class="text-muted-foreground leading-relaxed">
						{content.description}
					</p>
				{:else}
					<p class="text-muted-foreground italic">
						No additional information available for this cocktail.
					</p>
				{/if}
			</CollapsibleSection>
		</div>

		<!-- Right Column: Verdict -->
		<div class="space-y-6">
			<RecipeVerdictCard {recipe} recipeSteps={initialRecipeSteps} />

			<!-- Serving suggestion card -->
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
						<span class="text-sm text-muted-foreground">Dilution</span>
						<span class="text-sm font-medium">{recipe.recipeTechniqueDilutionPercentage}%</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-sm text-muted-foreground">Base Spirit</span>
						<Badge variant="outline">{recipe.recipeCategoryDescription}</Badge>
					</div>
				</Card.Content>
			</Card.Root>
		</div>
	</div>
</section>
