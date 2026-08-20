<script lang="ts">
	import { FlaskConical, GlassWater, Heart, Martini, Star } from 'lucide-svelte';

	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { haptics } from '$lib/utils/haptics';
	import { cdnSrc } from '$lib/utils/image';
	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import { calculateOverallScore } from '$lib/math';
	import type { View } from '$lib/types';
	import { cn } from '$lib/utils';

	let {
		recipe,
		viewMode = 'grid',
		isFavorite = false,
		isFeatured = false,
		canModify = false,
		authenticated = true,
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
		authenticated?: boolean;
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
		{ max: 3, label: 'Bottom Shelf', bg: 'bg-neon-amber-500' },
		{ max: 4, label: 'Decent', bg: 'bg-neon-yellow-500' },
		{ max: 5, label: 'Standard', bg: 'bg-neon-yellow-400' },
		{ max: 6, label: 'Good', bg: 'bg-lime-500' },
		{ max: 7, label: 'Top Shelf', bg: 'bg-neon-green-500' },
		{ max: 8, label: "Connoisseur's Choice", bg: 'bg-emerald-500' },
		{ max: 9, label: 'Favorite', bg: 'bg-blue-500' },
		{ max: 10, label: 'Best in House', bg: 'bg-secondary-500' },
	];

	const rating = $derived(
		ratingsMap.find(({ max }) => score <= max) || ratingsMap[ratingsMap.length - 1]
	);

	const hasRatings = $derived(score > 0);
</script>

{#if viewMode === 'grid'}
	<!-- Grid View Card — liquid glass -->
	<a href="/catalog/{recipe.recipeId}" class="block group h-full">
		<div class="relative rounded-2xl overflow-hidden h-full browse-grid-card">
			<!-- Blurred background glow from recipe image -->
			{#if recipe.recipeImageUrl}
				<img
					src={cdnSrc(recipe.recipeImageUrl, 64)}
					alt=""
					aria-hidden="true"
					class="absolute inset-0 w-full h-full object-cover scale-150 blur-3xl opacity-40 dark:opacity-30 saturate-150 pointer-events-none"
				/>
			{/if}

			<!-- Glass surface -->
			<div
				class="relative h-full flex flex-col bg-white/50 dark:bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-[1.7] border border-white/40 dark:border-white/[0.08] rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_16px_40px_-20px_rgba(31,20,60,0.28)] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_22px_48px_-20px_rgba(31,20,60,0.34)] transition-all duration-300"
			>
				<!-- Image area -->
				<div class="relative h-44 overflow-hidden rounded-t-2xl">
					<SkeletonImage
						src={recipe.recipeImageUrl}
						alt={recipe.recipeName}
						variant="recipe"
						class="h-full w-full"
						imgClass="transition-transform duration-300 group-hover:scale-110"
					/>
					<!-- Gradient fade into glass body -->
					<div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>

					<!-- Category pill (top left) -->
					<span
						class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/60 dark:bg-black/40 backdrop-blur-md border border-white/30 dark:border-white/15 text-foreground shadow-sm"
					>
						{recipe.recipeCategoryDescription}
					</span>

					<!-- Draft badge (owners/editors only) -->
					{#if canModify && recipe.published === false}
						<span
							class="absolute bottom-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-amber-500/90 text-white shadow"
						>
							Draft
						</span>
					{/if}

					<!-- Verdict pill (top right) -->
					{#if hasRatings}
						<span
							class={cn(
								'absolute top-3 right-3 flex flex-col items-center px-2 py-1 rounded-full text-white shadow-lg',
								rating.bg
							)}
							title={rating.label}
						>
							<span
								class="text-[8px] font-semibold uppercase tracking-wider opacity-80 leading-none"
								>verdict</span
							>
							<span class="text-sm font-bold leading-tight">{score.toFixed(1)}</span>
						</span>
					{/if}

					<!-- Action icons (bottom right, over image) -->
					{#if authenticated && workspaceId}
						<div
							class="absolute bottom-2 right-2 flex items-center gap-1"
							onclick={(e) => e.preventDefault()}
							onkeydown={(e) => e.preventDefault()}
							role="toolbar"
							tabindex="-1"
						>
							<form
								method="POST"
								action="{actionPath}/toggleFavorite"
								use:enhance={() => {
									haptics.light();
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
									class="p-1.5 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors"
									title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
								>
									<Heart
										class={cn(
											'h-4 w-4 transition-colors',
											isFavorite ? 'fill-red-500 text-red-500' : 'text-white/80 hover:text-red-400'
										)}
									/>
								</button>
							</form>
							{#if canModify}
								<form
									method="POST"
									action="{actionPath}/toggleFeatured"
									use:enhance={() => {
										haptics.light();
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
										class="p-1.5 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/50 transition-colors"
										title={isFeatured ? 'Remove from featured' : 'Add to featured'}
									>
										<Star
											class={cn(
												'h-4 w-4 transition-colors',
												isFeatured
													? 'fill-neon-yellow-500 text-neon-yellow-500'
													: 'text-white/80 hover:text-neon-yellow-400'
											)}
										/>
									</button>
								</form>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Text content -->
				<div class="flex-1 flex flex-col p-4 pt-3">
					<h3
						class="font-semibold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors"
					>
						{recipe.recipeName}
					</h3>
					<p class="text-sm text-muted-foreground/80 line-clamp-2 mt-1">
						{recipe.recipeDescription || 'A delicious cocktail recipe'}
					</p>
					{#if recipe.recipeTechniqueDescriptionText}
						<div class="flex items-center gap-1.5 mt-auto pt-2">
							<span class="flex items-center gap-1 text-[11px] text-muted-foreground/60">
								<TechniqueIcon class="h-3 w-3" />
								{recipe.recipeTechniqueDescriptionText}
							</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</a>
{:else}
	<!-- List View Card — liquid glass -->
	<a href="/catalog/{recipe.recipeId}" class="block group">
		<div class="relative rounded-2xl overflow-hidden browse-list-card">
			<!-- Blurred background image -->
			{#if recipe.recipeImageUrl}
				<img
					src={cdnSrc(recipe.recipeImageUrl, 64)}
					alt=""
					aria-hidden="true"
					class="absolute inset-0 w-full h-full object-cover scale-150 blur-3xl opacity-40 dark:opacity-30 saturate-150 pointer-events-none"
				/>
				<!-- dark scrim so the colored tint stays but text keeps contrast (dark mode only) -->
				<div
					class="absolute inset-0 rounded-2xl dark:bg-gradient-to-b dark:from-black/30 dark:to-black/45 pointer-events-none"
				></div>
			{/if}

			<!-- Glass surface -->
			<div
				class="relative flex items-center gap-3 p-3 bg-white/50 dark:bg-white/[0.06] backdrop-blur-2xl backdrop-saturate-[1.7] border border-white/40 dark:border-white/[0.08] rounded-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_10px_28px_-16px_rgba(31,20,60,0.25)] hover:bg-white/60 dark:hover:bg-white/[0.09] hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_14px_32px_-16px_rgba(31,20,60,0.3)] transition-all duration-200"
			>
				<!-- Thumbnail with verdict overlay -->
				<div
					class="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden shadow-md ring-1 ring-black/5 dark:ring-white/10"
				>
					<SkeletonImage
						src={recipe.recipeImageUrl}
						alt={recipe.recipeName}
						variant="recipe"
						class="h-full w-full"
					/>

					<!-- Verdict pill overlaid on image bottom -->
					{#if hasRatings}
						<div
							class="absolute inset-x-0 bottom-0 flex justify-center pb-1 bg-gradient-to-t from-black/60 to-transparent pt-3"
						>
							<span
								class={cn(
									'px-1.5 py-px rounded-full text-[10px] font-bold text-white leading-tight',
									rating.bg
								)}
								title={rating.label}
							>
								{score.toFixed(1)}
							</span>
						</div>
					{/if}
				</div>

				<!-- Text content — gets full remaining width -->
				<div class="flex-1 min-w-0">
					<h3
						class="font-semibold text-[15px] text-foreground truncate group-hover:text-primary transition-colors"
					>
						{recipe.recipeName}
						{#if canModify && recipe.published === false}
							<span
								class="ml-1 align-middle px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide bg-amber-500/90 text-white"
							>
								Draft
							</span>
						{/if}
					</h3>
					<p class="text-sm text-muted-foreground dark:text-white/70 truncate">
						{recipe.recipeDescription || 'A delicious cocktail recipe'}
					</p>
					<div class="flex items-center gap-1.5 mt-1">
						<span class="text-[11px] text-muted-foreground/60">
							{recipe.recipeCategoryDescription}
						</span>
						{#if recipe.recipeTechniqueDescriptionText}
							<span class="text-[11px] text-muted-foreground/30">&middot;</span>
							<span class="flex items-center gap-0.5 text-[11px] text-muted-foreground/60">
								<TechniqueIcon class="h-3 w-3" />
								{recipe.recipeTechniqueDescriptionText}
							</span>
						{/if}
					</div>
				</div>

				<!-- Compact action icons -->
				{#if authenticated && workspaceId}
					<div
						class="flex items-center gap-0.5 shrink-0"
						onclick={(e) => e.preventDefault()}
						onkeydown={(e) => e.preventDefault()}
						role="toolbar"
						tabindex="-1"
					>
						<form
							method="POST"
							action="{actionPath}/toggleFavorite"
							use:enhance={() => {
								haptics.light();
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
								class="p-1.5 rounded-full hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
								title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
							>
								<Heart
									class={cn(
										'h-4 w-4 transition-colors',
										isFavorite
											? 'fill-red-500 text-red-500'
											: 'text-muted-foreground/50 hover:text-red-500'
									)}
								/>
							</button>
						</form>
						{#if canModify}
							<form
								method="POST"
								action="{actionPath}/toggleFeatured"
								use:enhance={() => {
									haptics.light();
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
									class="p-1.5 rounded-full hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
									title={isFeatured ? 'Remove from featured' : 'Add to featured'}
								>
									<Star
										class={cn(
											'h-4 w-4 transition-colors',
											isFeatured
												? 'fill-neon-yellow-500 text-neon-yellow-500'
												: 'text-muted-foreground/50 hover:text-neon-yellow-500'
										)}
									/>
								</button>
							</form>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</a>
{/if}
