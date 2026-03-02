<script lang="ts">
	import { ArrowRight, Sparkles } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import ImagePlaceholder from '$lib/components/ImagePlaceholder.svelte';
	import { cn } from '$lib/utils';
	import type { View } from '$lib/types';

	const { recipe }: { recipe: View.BasicRecipe } = $props();

	const flavorBadges = $derived(
		[
			recipe.recipeSweetnessRating >= 6 && 'Sweet',
			recipe.recipeDrynessRating >= 6 && 'Dry',
			recipe.recipeStrengthRating >= 6 && 'Strong',
			recipe.recipeVersatilityRating >= 6 && 'Versatile',
		].filter(Boolean) as string[]
	);

	const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
</script>

<Card.Root class="overflow-hidden h-full">
	<a href="/catalog/{recipe.recipeId}" class="group block h-full">
		<div class="relative h-full">
			<!-- background image -->
			{#if recipe.recipeImageUrl}
				<img
					src={recipe.recipeImageUrl}
					alt={recipe.recipeName}
					class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
				/>
			{:else}
				<div class="absolute inset-0 bg-muted flex items-center justify-center">
					<ImagePlaceholder variant="recipe" class="w-16 h-16" />
				</div>
			{/if}

			<!-- gradient overlay -->
			<div class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30"></div>

			<!-- content overlay -->
			<div class="relative z-10 p-5 flex flex-col justify-end h-full">
				<div class="flex items-center gap-2 mb-2">
					<Badge variant="secondary" class="gap-1 bg-background/80 backdrop-blur-sm text-[10px]">
						<Sparkles class="h-3 w-3" />
						Cocktail of the Day
					</Badge>
					<span class="text-[10px] text-muted-foreground/80">{today}</span>
				</div>

				<h3 class="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
					{recipe.recipeName}
				</h3>

				<div class="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-2">
					{#if recipe.recipeCategoryDescription}
						<span>{recipe.recipeCategoryDescription}</span>
					{/if}
					{#if recipe.recipeTechniqueDescriptionText}
						<span class="opacity-40">·</span>
						<span>{recipe.recipeTechniqueDescriptionText}</span>
					{/if}
				</div>

				{#if recipe.recipeDescription}
					<p class="text-xs text-muted-foreground line-clamp-2 mb-3">{recipe.recipeDescription}</p>
				{/if}

				<div class="flex items-center gap-2 flex-wrap">
					{#if flavorBadges.length > 0}
						{#each flavorBadges as label}
							<Badge variant="outline" class="text-[10px] bg-background/50 backdrop-blur-sm">{label}</Badge>
						{/each}
					{/if}
					<span class={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 ml-auto text-xs h-7')}>
						Make This
						<ArrowRight class="h-3 w-3" />
					</span>
				</div>
			</div>
		</div>
	</a>
</Card.Root>
