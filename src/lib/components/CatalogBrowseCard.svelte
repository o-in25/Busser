<script lang="ts">
	import { FlaskConical, GlassWater, Heart, Martini, Star } from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import placeholderDark from '$lib/assets/placeholder-alt-dark.png';
	import placeholderLight from '$lib/assets/placeholder-alt-light.png';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import type { View } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		recipe,
		viewMode = 'grid',
		isFavorite = false,
		isFeatured = false,
		canModify = false,
		workspaceId = '',
		onToggleFavorite,
		onToggleFeatured,
	}: {
		recipe: View.BasicRecipe;
		viewMode?: 'grid' | 'list';
		isFavorite?: boolean;
		isFeatured?: boolean;
		canModify?: boolean;
		workspaceId?: string;
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

				<!-- Technique badge + action buttons -->
				<div class="absolute top-3 right-3 flex items-center gap-1">
					{#if recipe.recipeTechniqueDescriptionText}
						<div class="p-1.5 rounded-full bg-background/80 backdrop-blur-sm">
							<TechniqueIcon class="h-4 w-4 text-muted-foreground" />
						</div>
					{/if}
				</div>

				<!-- Favorite/Featured indicators -->
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
				<div class="flex items-start justify-between gap-2">
					<a href="/catalog/{recipe.recipeId}" class="flex-1 min-w-0">
						<h3 class="font-bold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
							{recipe.recipeName}
						</h3>
						<p class="text-sm text-muted-foreground line-clamp-2">
							{recipe.recipeDescription || 'A delicious cocktail recipe'}
						</p>
					</a>
					<!-- Action buttons -->
					{#if workspaceId}
						<div class="flex items-center gap-0.5 shrink-0">
							<form
								method="POST"
								action="/catalog/browse?/toggleFavorite"
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
									action="/catalog/browse?/toggleFeatured"
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
				</div>
			</Card.Content>
		</Card.Root>
	</div>
{:else}
	<!-- List View Card -->
	<div class="block group">
		<Card.Root class="hover:shadow-md transition-all duration-200">
			<div class="flex items-center gap-4 p-3">
				<!-- Thumbnail -->
				<a href="/catalog/{recipe.recipeId}" class="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden">
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
				</a>

				<!-- Action buttons -->
				{#if workspaceId}
					<div class="flex items-center gap-0.5 shrink-0">
						<form
							method="POST"
							action="/catalog/browse?/toggleFavorite"
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
								action="/catalog/browse?/toggleFeatured"
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
			</div>
		</Card.Root>
	</div>
{/if}
