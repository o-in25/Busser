<script lang="ts">
	import { FlaskConical, GlassWater, Martini } from 'lucide-svelte';

	import placeholderDark from '$lib/assets/placeholder-alt-dark.png';
	import placeholderLight from '$lib/assets/placeholder-alt-light.png';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import type { View } from '$lib/types';

	let {
		recipe,
		viewMode = 'grid',
	}: {
		recipe: View.BasicRecipe;
		viewMode?: 'grid' | 'list';
	} = $props();

	// Technique icon mapping
	const techniqueIcons: Record<string, typeof Martini> = {
		Stirred: Martini,
		Shaken: GlassWater,
		Built: FlaskConical,
	};
	const TechniqueIcon = techniqueIcons[recipe.recipeTechniqueDescriptionText || ''] || GlassWater;
</script>

{#if viewMode === 'grid'}
	<!-- Grid View Card -->
	<a href="/catalog/{recipe.recipeId}" class="block group">
		<Card.Root class="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
			<!-- Image -->
			<div class="relative h-44 overflow-hidden">
				{#if recipe.recipeImageUrl}
					<img
						src={recipe.recipeImageUrl}
						alt={recipe.recipeName}
						class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
					/>
				{:else}
					<div
						class="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center dark:hidden"
					>
						<img
							src={placeholderLight}
							alt={recipe.recipeName}
							class="w-20 h-20 object-contain opacity-40"
						/>
					</div>
					<div
						class="w-full h-full bg-gradient-to-br from-muted to-muted/50 items-center justify-center hidden dark:flex"
					>
						<img
							src={placeholderDark}
							alt={recipe.recipeName}
							class="w-20 h-20 object-contain opacity-40"
						/>
					</div>
				{/if}
				<!-- Gradient overlay on hover -->
				<div
					class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
				></div>

				<!-- Spirit category badge -->
				<Badge variant="secondary" class="absolute top-3 left-3 bg-background/80 backdrop-blur-sm">
					{recipe.recipeCategoryDescription}
				</Badge>

				<!-- Technique badge -->
				{#if recipe.recipeTechniqueDescriptionText}
					<div class="absolute top-3 right-3 p-1.5 rounded-full bg-background/80 backdrop-blur-sm">
						<TechniqueIcon class="h-4 w-4 text-muted-foreground" />
					</div>
				{/if}
			</div>

			<!-- Content -->
			<Card.Content class="p-4">
				<h3 class="font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
					{recipe.recipeName}
				</h3>
				<p class="text-sm text-muted-foreground line-clamp-2">
					{recipe.recipeDescription || 'A delicious cocktail recipe'}
				</p>
			</Card.Content>
		</Card.Root>
	</a>
{:else}
	<!-- List View Card -->
	<a href="/catalog/{recipe.recipeId}" class="block group">
		<Card.Root class="hover:shadow-md transition-all duration-200">
			<div class="flex items-center gap-4 p-3">
				<!-- Thumbnail -->
				<div class="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
					{#if recipe.recipeImageUrl}
						<img
							src={recipe.recipeImageUrl}
							alt={recipe.recipeName}
							class="w-full h-full object-cover"
						/>
					{:else}
						<div class="w-full h-full bg-muted flex items-center justify-center dark:hidden">
							<img
								src={placeholderLight}
								alt={recipe.recipeName}
								class="w-10 h-10 object-contain opacity-40"
							/>
						</div>
						<div class="w-full h-full bg-muted items-center justify-center hidden dark:flex">
							<img
								src={placeholderDark}
								alt={recipe.recipeName}
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
								{recipe.recipeName}
							</h3>
							<p class="text-sm text-muted-foreground line-clamp-1">
								{recipe.recipeDescription || 'A delicious cocktail recipe'}
							</p>
						</div>
						<Badge variant="secondary" class="shrink-0">
							{recipe.recipeCategoryDescription}
						</Badge>
					</div>

					<!-- Meta info -->
					<div class="flex items-center gap-3 mt-2">
						{#if recipe.recipeTechniqueDescriptionText}
							<span class="flex items-center gap-1 text-xs text-muted-foreground">
								<TechniqueIcon class="h-3.5 w-3.5" />
								{recipe.recipeTechniqueDescriptionText}
							</span>
						{/if}
					</div>
				</div>
			</div>
		</Card.Root>
	</a>
{/if}
