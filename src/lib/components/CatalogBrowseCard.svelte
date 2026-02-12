<script lang="ts">
	import { FlaskConical, ThumbsUp, GlassWater, Heart, Martini, Star } from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ImagePlaceholder from '$lib/components/ImagePlaceholder.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { calculateOverallScore } from '$lib/math';
	import type { View } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		recipe,
		viewMode = 'grid',
		isFavorite = false,
		isFeatured = false,
		canModify = false,
		workspaceId = '',
		actionPath = '?',
		onToggleFavorite,
		onToggleFeatured,
	}: {
		recipe: View.BasicRecipe;
		viewMode?: 'grid' | 'list';
		isFavorite?: boolean;
		isFeatured?: boolean;
		canModify?: boolean;
		workspaceId?: string;
		actionPath?: string;
		onToggleFavorite?: (recipeId: number) => void;
		onToggleFeatured?: (recipeId: number) => void;
	} = $props();

	// Technique icon mapping
	const techniqueIcons: Record<string, typeof Martini> = {
		Stirred: Martini,
		Shaken: GlassWater,
		Built: FlaskConical,
	};
	const TechniqueIcon = $derived(
		techniqueIcons[recipe.recipeTechniqueDescriptionText || ''] || GlassWater
	);

	// Calculate overall score (same as RecipeVerdictCard)
	const score = $derived(
		calculateOverallScore(
			recipe.recipeVersatilityRating,
			recipe.recipeSweetnessRating,
			recipe.recipeDrynessRating,
			recipe.recipeStrengthRating
		)
	);

	// Rating tiers with labels and colors (matching RecipeVerdictCard)
	const ratingsMap = [
		{ max: 0, label: 'No Rating', bg: 'bg-gray-500' },
		{ max: 2, label: 'Needs Work', bg: 'bg-red-500' },
		{ max: 3, label: 'Bottom Shelf', bg: 'bg-orange-500' },
		{ max: 4, label: 'Decent', bg: 'bg-yellow-500' },
		{ max: 5, label: 'Standard', bg: 'bg-yellow-400' },
		{ max: 6, label: 'Good', bg: 'bg-lime-500' },
		{ max: 7, label: 'Top Shelf', bg: 'bg-green-500' },
		{ max: 8, label: "Connoisseur's Choice", bg: 'bg-emerald-500' },
		{ max: 9, label: 'Favorite', bg: 'bg-blue-500' },
		{ max: 10, label: 'Best in House', bg: 'bg-violet-500' },
	];

	const rating = $derived(
		ratingsMap.find(({ max }) => score <= max) || ratingsMap[ratingsMap.length - 1]
	);

	const hasRatings = $derived(score > 0);
</script>

{#if viewMode === 'grid'}
	<!-- Grid View Card -->
	<div class="block group">
		<Card.Root class="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
			<!-- Image -->
			<a href="/catalog/{recipe.recipeId}" class="relative h-44 overflow-hidden block">
				{#if recipe.recipeImageUrl}
					<img
						src={recipe.recipeImageUrl}
						alt={recipe.recipeName}
						class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
					/>
				{:else}
					<ImagePlaceholder variant="recipe" class="w-20 h-20" />
				{/if}
				<!-- Gradient overlay on hover -->
				<div
					class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
				></div>

				<!-- Spirit category badge (top left) -->
				<Badge variant="secondary" class="absolute top-3 left-3 backdrop-blur-sm bg-background/80">
					{recipe.recipeCategoryDescription}
				</Badge>

				<!-- Favorite/Featured indicators (bottom right) -->
				{#if isFavorite || isFeatured}
					<div class="absolute bottom-3 right-3 flex items-center gap-1">
						{#if isFeatured}
							<div class="p-1 rounded-full bg-yellow-500/90 backdrop-blur-sm">
								<Star class="h-3 w-3 fill-current text-white" />
							</div>
						{/if}
						{#if isFavorite}
							<div class="p-1 rounded-full bg-red-500/90 backdrop-blur-sm">
								<Heart class="h-3 w-3 fill-current text-white" />
							</div>
						{/if}
					</div>
				{/if}
			</a>

			<!-- Content -->
			<Card.Content class="p-4">
				<a href="/catalog/{recipe.recipeId}" class="block min-w-0">
					<h3
						class="font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1"
					>
						{recipe.recipeName}
					</h3>
					<p class="text-sm text-muted-foreground line-clamp-2">
						{recipe.recipeDescription || 'A delicious cocktail recipe'}
					</p>
				</a>

				<!-- Meta info row: technique -->
				{#if recipe.recipeTechniqueDescriptionText}
					<div class="flex items-center gap-2 mt-2">
						<span class="flex items-center gap-1 text-xs text-muted-foreground">
							<TechniqueIcon class="h-3.5 w-3.5" />
							{recipe.recipeTechniqueDescriptionText}
						</span>
					</div>
				{/if}

				<!-- Action buttons and rating -->
				{#if workspaceId || hasRatings}
					<div class="flex items-center justify-between gap-1 mt-2 pt-2 border-t">
						<div class="flex items-center gap-1">
							{#if workspaceId}
								<form
									method="POST"
									action="{actionPath}/toggleFavorite"
									use:enhance={() => {
										onToggleFavorite?.(recipe.recipeId);
										return async ({ result }) => {
											if (result.type === 'failure') invalidateAll();
										};
									}}
								>
									<input type="hidden" name="recipeId" value={recipe.recipeId} />
									<input type="hidden" name="workspaceId" value={workspaceId} />
									<button
										type="submit"
										class={cn(
											'flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
											isFavorite
												? 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
												: 'hover:bg-muted text-muted-foreground hover:text-foreground'
										)}
										title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
									>
										<Heart class={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} />
										<span class="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
									</button>
								</form>
								{#if canModify}
									<form
										method="POST"
										action="{actionPath}/toggleFeatured"
										use:enhance={() => {
											onToggleFeatured?.(recipe.recipeId);
											return async ({ result }) => {
												if (result.type === 'failure') invalidateAll();
											};
										}}
									>
										<input type="hidden" name="recipeId" value={recipe.recipeId} />
										<input type="hidden" name="workspaceId" value={workspaceId} />
										<button
											type="submit"
											class={cn(
												'flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
												isFeatured
													? 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
													: 'hover:bg-muted text-muted-foreground hover:text-foreground'
											)}
											title={isFeatured ? 'Remove from featured' : 'Add to featured'}
										>
											<Star class={cn('h-3.5 w-3.5', isFeatured && 'fill-current')} />
											<span class="hidden sm:inline">{isFeatured ? 'Featured' : 'Feature'}</span>
										</button>
									</form>
								{/if}
							{/if}
						</div>
						{#if hasRatings}
							<span
								class={cn(
									'flex items-center gap-1 px-2 py-1 rounded text-xs font-bold text-white',
									rating.bg
								)}
								title={rating.label}
							>
								<ThumbsUp class="h-3 w-3" />
								{score.toFixed(1)}/10
							</span>
						{/if}
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</div>
{:else}
	<!-- List View Card -->
	<div class="block group">
		<Card.Root class="hover:shadow-md transition-all duration-200">
			<div class="flex items-center gap-4 p-3">
				<!-- Thumbnail -->
				<a
					href="/catalog/{recipe.recipeId}"
					class="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden"
				>
					{#if recipe.recipeImageUrl}
						<img
							src={recipe.recipeImageUrl}
							alt={recipe.recipeName}
							class="w-full h-full object-cover"
						/>
					{:else}
						<ImagePlaceholder variant="recipe" class="w-10 h-10" />
					{/if}
					<!-- Favorite/Featured indicators -->
					{#if isFavorite || isFeatured}
						<div class="absolute bottom-1 right-1 flex items-center gap-0.5">
							{#if isFeatured}
								<div class="p-0.5 rounded-full bg-yellow-500/90">
									<Star class="h-2.5 w-2.5 fill-current text-white" />
								</div>
							{/if}
							{#if isFavorite}
								<div class="p-0.5 rounded-full bg-red-500/90">
									<Heart class="h-2.5 w-2.5 fill-current text-white" />
								</div>
							{/if}
						</div>
					{/if}
				</a>

				<!-- Content -->
				<a href="/catalog/{recipe.recipeId}" class="flex-1 min-w-0">
					<!-- Row 1: Recipe Name (Category) -->
					<div class="flex items-center gap-2">
						<h3 class="font-bold text-base group-hover:text-primary transition-colors truncate">
							{recipe.recipeName}
						</h3>
						<Badge variant="secondary" class="shrink-0 text-xs">
							{recipe.recipeCategoryDescription}
						</Badge>
					</div>

					<!-- Row 2: Description -->
					<p class="text-sm text-muted-foreground line-clamp-1">
						{recipe.recipeDescription || 'A delicious cocktail recipe'}
					</p>

					<!-- Row 3: Prep Method -->
					{#if recipe.recipeTechniqueDescriptionText}
						<div class="flex items-center gap-2 mt-1">
							<span class="flex items-center gap-1 text-xs text-muted-foreground">
								<TechniqueIcon class="h-3.5 w-3.5" />
								{recipe.recipeTechniqueDescriptionText}
							</span>
						</div>
					{/if}
				</a>

				<!-- Action buttons and rating -->
				{#if workspaceId || hasRatings}
					<div class="flex flex-col items-end gap-1 shrink-0">
						{#if workspaceId}
							<div class="flex items-center gap-1">
								<form
									method="POST"
									action="{actionPath}/toggleFavorite"
									use:enhance={() => {
										onToggleFavorite?.(recipe.recipeId);
										return async ({ result }) => {
											if (result.type === 'failure') invalidateAll();
										};
									}}
								>
									<input type="hidden" name="recipeId" value={recipe.recipeId} />
									<input type="hidden" name="workspaceId" value={workspaceId} />
									<button
										type="submit"
										class="p-1.5 rounded-md hover:bg-muted transition-colors"
										title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
									>
										<Heart
											class={cn(
												'h-4 w-4 transition-colors',
												isFavorite
													? 'fill-red-500 text-red-500'
													: 'text-muted-foreground hover:text-red-500'
											)}
										/>
									</button>
								</form>
								{#if canModify}
									<form
										method="POST"
										action="{actionPath}/toggleFeatured"
										use:enhance={() => {
											onToggleFeatured?.(recipe.recipeId);
											return async ({ result }) => {
												if (result.type === 'failure') invalidateAll();
											};
										}}
									>
										<input type="hidden" name="recipeId" value={recipe.recipeId} />
										<input type="hidden" name="workspaceId" value={workspaceId} />
										<button
											type="submit"
											class="p-1.5 rounded-md hover:bg-muted transition-colors"
											title={isFeatured ? 'Remove from featured' : 'Add to featured'}
										>
											<Star
												class={cn(
													'h-4 w-4 transition-colors',
													isFeatured
														? 'fill-yellow-500 text-yellow-500'
														: 'text-muted-foreground hover:text-yellow-500'
												)}
											/>
										</button>
									</form>
								{/if}
							</div>
						{/if}
						{#if hasRatings}
							<span
								class={cn(
									'flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold text-white',
									rating.bg
								)}
								title={rating.label}
							>
								<ThumbsUp class="h-3 w-3" />
								{score.toFixed(1)}/10
							</span>
						{/if}
					</div>
				{/if}
			</div>
		</Card.Root>
	</div>
{/if}
