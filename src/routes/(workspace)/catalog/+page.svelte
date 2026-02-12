<script lang="ts">
	import {
		ArrowRight,
		BookOpen,
		FlaskConical,
		GlassWater,
		Heart,
		Lightbulb,
		Plus,
		Search,
		Sparkles,
		Star,
		TrendingUp,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { cn } from '$lib/utils';

	import type { PageData } from './$types';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';

	let { data }: { data: PageData } = $props();
	const {
		spirits,
		spiritCounts,
		recentCocktails,
		featuredCocktail,
		totalRecipes,
		popularSpirit,
		favoriteRecipeIds,
		featuredRecipeIds,
	} = data.args;

	// Track favorite/featured state locally for optimistic updates
	let favorites = $state(new Set(favoriteRecipeIds));
	let featured = $state(new Set(featuredRecipeIds));

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';

	// Search state
	let searchQuery = $state('');

	function handleSearch(e: Event) {
		e.preventDefault();
		if (searchQuery.trim()) {
			goto(`/catalog/browse?search=${encodeURIComponent(searchQuery.trim())}`);
		}
	}

	// Bartender tips - rotating educational content
	const bartenderTips = [
		{
			title: 'The Fundamental Law of Cocktails',
			tip: 'There is no chilling without dilution, and there is no dilution without chilling. The two are inextricably linked.',
			source: 'Dave Arnold',
		},
		{
			title: 'Perfect Stirring',
			tip: 'Stir drinks for about 30 seconds with good ice. Stirred drinks should be silky and slightly less diluted than shaken ones.',
			source: 'Classic Technique',
		},
		{
			title: 'The Shake Test',
			tip: 'Shake until the outside of your shaker is frosted and almost painfully cold to hold - usually 10-15 seconds.',
			source: 'Classic Technique',
		},
		{
			title: 'Ice Matters',
			tip: "Clear ice isn't just pretty - it's denser and melts slower, giving you better control over dilution in your drinks.",
			source: 'Ice Science',
		},
		{
			title: 'Fresh Citrus',
			tip: 'Always use freshly squeezed citrus juice. The flavor degrades significantly after just a few hours.',
			source: 'Classic Technique',
		},
		{
			title: 'Why Freezer Ice is Cloudy',
			tip: 'Ice trays freeze from all sides, trapping gas and impurities in the center. Clear ice forms layer by layer from one direction, pushing out impurities as it grows.',
			source: 'Ice Science',
		},
		{
			title: 'The Supercooling Effect',
			tip: 'Water needs to be chilled below 0°C to form ice crystals. Slow freezing produces fewer, larger crystals that are clearer and melt more slowly.',
			source: 'Dave Arnold',
		},
		{
			title: 'Essential Bar Tools',
			tip: 'Start with a good jigger set, Hawthorne strainer, julep strainer, muddler, and a Y-peeler. These basics will cover most cocktail recipes.',
			source: 'Bar Equipment',
		},
		{
			title: 'The 2-Inch Cube',
			tip: 'Large ice cubes have less surface area relative to volume, meaning slower melting and less dilution - perfect for spirit-forward drinks.',
			source: 'Ice Science',
		},
		{
			title: 'Water Expands When It Freezes',
			tip: 'Water expands about 9% when freezing. This force can shatter rocks and pipes - and explains those peaks on your ice cubes.',
			source: 'Ice Science',
		},
		{
			title: 'The Lewis Bag',
			tip: 'For crushed ice, use a Lewis bag and mallet. It gives you control over ice texture and is quieter than an electric crusher.',
			source: 'Bar Equipment',
		},
	];

	// Pick a random tip
	function getRandomTip() {
		return bartenderTips[Math.floor(Math.random() * bartenderTips.length)];
	}
	let currentTip = $state(getRandomTip());

	function showNewTip() {
		let newTip = getRandomTip();
		// Ensure we get a different tip if possible
		while (bartenderTips.length > 1 && newTip.title === currentTip.title) {
			newTip = getRandomTip();
		}
		currentTip = newTip;
	}
</script>

<svelte:head>
	<title>Catalog - Busser</title>
</svelte:head>

<!-- Hero Section -->
<div
	class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-8 mt-4"
>
	<div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
	<div class="relative px-6 py-10 md:py-14">
		<div class="max-w-2xl">
			<h1 class="text-4xl md:text-5xl font-bold mb-3">Cocktail Catalog</h1>
			<p class="text-lg text-muted-foreground mb-6">
				Explore recipes by spirit, discover new favorites, and master the art of mixology.
			</p>

			<!-- Search bar -->
			<form onsubmit={handleSearch} class="flex gap-2 max-w-md">
				<div class="relative flex-1">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search cocktails..."
						bind:value={searchQuery}
						class="pl-10"
					/>
				</div>
				<Button type="submit">Search</Button>
			</form>
		</div>

		<!-- Quick stats -->
		<div class="flex flex-wrap gap-4 mt-8">
			<a
				href="/catalog/browse"
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border hover:border-primary/50 hover:bg-background transition-colors"
			>
				<FlaskConical class="h-5 w-5 text-primary" />
				<div>
					<p class="text-2xl font-bold">{totalRecipes}</p>
					<p class="text-xs text-muted-foreground">Total Recipes</p>
				</div>
			</a>
			<div
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border"
			>
				<GlassWater class="h-5 w-5 text-primary" />
				<div>
					<p class="text-2xl font-bold">{spirits.length}</p>
					<p class="text-xs text-muted-foreground">Spirit Categories</p>
				</div>
			</div>
			{#if popularSpirit}
				<a
					href="/catalog/browse/{popularSpirit.recipeCategoryId}"
					class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border hover:border-primary/50 hover:bg-background transition-colors"
				>
					<TrendingUp class="h-5 w-5 text-primary" />
					<div>
						<p class="text-2xl font-bold">{popularSpirit.recipeCategoryDescription}</p>
						<p class="text-xs text-muted-foreground">Most Popular</p>
					</div>
				</a>
			{/if}
		</div>
	</div>
</div>

<!-- Spirit Cards Section -->
<section class="mb-10">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-2xl font-bold flex items-center gap-2">
			<GlassWater class="h-6 w-6 text-primary" />
			Explore by Spirit
		</h2>
		<a
			class="hidden sm:flex text-sm font-medium hover:underline items-center text-muted-foreground hover:text-foreground transition-colors"
			href="/catalog/browse"
		>
			View all cocktails
			<ArrowRight class="ms-1 h-4 w-4" />
		</a>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each spirits as spirit}
			{@const count = spiritCounts[spirit.recipeCategoryId] || 0}
			<a href="/catalog/browse/{spirit.recipeCategoryId}" class="block group">
				<Card.Root
					class="relative overflow-hidden h-48 hover:shadow-lg transition-all duration-300"
				>
					<!-- Background image -->
					<div class="absolute inset-0">
						<img
							src={spirit.recipeCategoryDescriptionImageUrl}
							alt={spirit.recipeCategoryDescription}
							class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
						/>
						<div
							class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"
						></div>
					</div>

					<!-- Content -->
					<div class="absolute inset-0 p-5 flex flex-col justify-end">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-bold text-foreground">
								{spirit.recipeCategoryDescription}
							</h3>
							<Badge variant="secondary" class="bg-background/80 backdrop-blur-sm">
								{count}
								{count === 1 ? 'recipe' : 'recipes'}
							</Badge>
						</div>
						<p class="text-sm text-muted-foreground mt-1 line-clamp-2">
							{spirit.recipeCategoryDescriptionText}
						</p>
					</div>

					<!-- Hover arrow indicator -->
					<div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
						<div class="p-2 rounded-full bg-primary text-primary-foreground">
							<ArrowRight class="h-4 w-4" />
						</div>
					</div>
				</Card.Root>
			</a>
		{/each}
	</div>

	<!-- Mobile: View all button -->
	<div class="flex sm:hidden justify-center mt-4">
		<a href="/catalog/browse" class={cn(buttonVariants({ variant: 'outline' }), 'w-full')}>
			View All Cocktails
			<ArrowRight class="ml-2 h-4 w-4" />
		</a>
	</div>
</section>

<!-- Featured Cocktail + Recent Cocktails Grid -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
	<!-- Featured Cocktail -->
	{#if featuredCocktail}
		<Card.Root class="lg:col-span-1 overflow-hidden">
			<div class="relative h-48">
				{#if featuredCocktail.recipeImageUrl}
					<img
						src={featuredCocktail.recipeImageUrl}
						alt={featuredCocktail.recipeName}
						class="h-full w-full object-cover"
					/>
				{:else}
					<div
						class="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center"
					>
						<Sparkles class="h-12 w-12 text-primary/40" />
					</div>
				{/if}
				<div class="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
				<Badge class="absolute top-3 left-3 bg-primary text-primary-foreground">
					<Star class="h-3 w-3 mr-1" />
					Featured
				</Badge>
				<!-- Action buttons on featured card -->
				<div class="absolute top-3 right-3 flex gap-1">
					<form
						method="POST"
						action="?/toggleFavorite"
						use:enhance={() => {
							const newFavorites = new Set(favorites);
							if (newFavorites.has(featuredCocktail.recipeId)) {
								newFavorites.delete(featuredCocktail.recipeId);
							} else {
								newFavorites.add(featuredCocktail.recipeId);
							}
							favorites = newFavorites;
							return async ({ result }) => {
								if (result.type !== 'success' || (result.data && !result.data.success)) {
									invalidateAll();
								}
							};
						}}
					>
						<input type="hidden" name="recipeId" value={featuredCocktail.recipeId} />
						<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
						<button
							type="submit"
							class="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
							title={favorites.has(featuredCocktail.recipeId)
								? 'Remove from favorites'
								: 'Add to favorites'}
						>
							<Heart
								class={cn(
									'h-4 w-4 transition-colors',
									favorites.has(featuredCocktail.recipeId)
										? 'fill-red-500 text-red-500'
										: 'text-muted-foreground hover:text-red-500'
								)}
							/>
						</button>
					</form>
				</div>
			</div>
			<Card.Content class="pt-4">
				<h3 class="font-bold text-lg mb-1">{featuredCocktail.recipeName}</h3>
				<p class="text-sm text-muted-foreground mb-3">
					{featuredCocktail.recipeCategoryDescription}
				</p>
				<a
					href="/catalog/{featuredCocktail.recipeId}"
					class={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'w-full')}
				>
					View Recipe
					<ArrowRight class="ml-2 h-4 w-4" />
				</a>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Recent Cocktails -->
	<Card.Root class={featuredCocktail ? 'lg:col-span-2' : 'lg:col-span-3'}>
		<Card.Header>
			<Card.Title class="flex items-center gap-2">
				<BookOpen class="h-5 w-5 text-primary" />
				Recent Additions
			</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if recentCocktails.length === 0}
				<p class="text-muted-foreground text-center py-8">
					No cocktails yet. Add your first recipe!
				</p>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each recentCocktails.slice(0, 6) as cocktail}
						<div
							class="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
						>
							<a
								href="/catalog/{cocktail.recipeId}"
								class="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted"
							>
								{#if cocktail.recipeImageUrl}
									<img
										src={cocktail.recipeImageUrl}
										alt={cocktail.recipeName}
										class="w-full h-full object-cover"
									/>
								{:else}
									<div class="w-full h-full flex items-center justify-center">
										<GlassWater class="h-5 w-5 text-muted-foreground" />
									</div>
								{/if}
							</a>
							<a href="/catalog/{cocktail.recipeId}" class="flex-1 min-w-0">
								<p
									class="font-medium truncate group-hover:text-accent-foreground transition-colors"
								>
									{cocktail.recipeName}
								</p>
								<p
									class="text-xs text-muted-foreground group-hover:text-accent-foreground/70 transition-colors"
								>
									{cocktail.recipeCategoryDescription}
								</p>
							</a>
							<div class="flex items-center gap-1">
								<form
									method="POST"
									action="?/toggleFavorite"
									use:enhance={() => {
										// Optimistic update with new Set for reactivity
										const newFavorites = new Set(favorites);
										if (newFavorites.has(cocktail.recipeId)) {
											newFavorites.delete(cocktail.recipeId);
										} else {
											newFavorites.add(cocktail.recipeId);
										}
										favorites = newFavorites;
										return async ({ result }) => {
											// Revert on any error
											if (result.type !== 'success' || (result.data && !result.data.success)) {
												invalidateAll();
											}
										};
									}}
								>
									<input type="hidden" name="recipeId" value={cocktail.recipeId} />
									<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
									<button
										type="submit"
										class="p-1.5 rounded-md hover:bg-background/50 transition-colors"
										title={favorites.has(cocktail.recipeId)
											? 'Remove from favorites'
											: 'Add to favorites'}
									>
										<Heart
											class={cn(
												'h-4 w-4 transition-colors group-hover:text-accent-foreground',
												favorites.has(cocktail.recipeId)
													? 'fill-red-500 text-red-500 group-hover:fill-accent-foreground'
													: 'text-muted-foreground hover:text-red-500'
											)}
										/>
									</button>
								</form>
								{#if canModify}
									<form
										method="POST"
										action="?/toggleFeatured"
										use:enhance={() => {
											// Optimistic update with new Set for reactivity
											const newFeatured = new Set(featured);
											if (newFeatured.has(cocktail.recipeId)) {
												newFeatured.delete(cocktail.recipeId);
											} else {
												newFeatured.add(cocktail.recipeId);
											}
											featured = newFeatured;
											return async ({ result }) => {
												// Revert on any error
												if (result.type !== 'success' || (result.data && !result.data.success)) {
													invalidateAll();
												}
											};
										}}
									>
										<input type="hidden" name="recipeId" value={cocktail.recipeId} />
										<input type="hidden" name="workspaceId" value={workspace.workspaceId} />
										<button
											type="submit"
											class="p-1.5 rounded-md hover:bg-background/50 transition-colors"
											title={featured.has(cocktail.recipeId)
												? 'Remove from featured'
												: 'Add to featured'}
										>
											<Star
												class={cn(
													'h-4 w-4 transition-colors group-hover:text-accent-foreground',
													featured.has(cocktail.recipeId)
														? 'fill-yellow-500 text-yellow-500 group-hover:fill-accent-foreground'
														: 'text-muted-foreground hover:text-yellow-500'
												)}
											/>
										</button>
									</form>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</div>

<!-- Bottom Row: Bartender Tip + Add Recipe CTA -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
	<!-- Bartender Tip -->
	<Card.Root
		class="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-colors"
		onclick={showNewTip}
	>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-amber-600 dark:text-amber-400">
				<Lightbulb class="h-5 w-5" />
				Bartender's Tip
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<h4 class="font-semibold mb-2">{currentTip.title}</h4>
			<p class="text-muted-foreground text-sm leading-relaxed mb-3">
				"{currentTip.tip}"
			</p>
			<p class="text-xs text-muted-foreground/70 italic">
				— {currentTip.source}
			</p>
			<p class="text-xs text-amber-600/50 dark:text-amber-400/50 mt-3">Click for another tip</p>
		</Card.Content>
	</Card.Root>

	<!-- Add Recipe CTA -->
	{#if canModify}
		<Card.Root class="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
			<Card.Content class="flex flex-col items-center justify-center h-full py-8 text-center">
				<div class="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
					<Plus class="h-8 w-8 text-primary" />
				</div>
				<h3 class="text-xl font-bold mb-2">Add a New Recipe</h3>
				<p class="text-muted-foreground text-sm mb-4 max-w-xs">
					Create a new cocktail recipe from your inventory ingredients.
				</p>
				<a href="/catalog/add" class={buttonVariants()}>
					<Plus class="h-4 w-4 mr-2" />
					Add Recipe
				</a>
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root class="bg-muted/30">
			<Card.Content class="flex flex-col items-center justify-center h-full py-8 text-center">
				<BookOpen class="h-12 w-12 text-muted-foreground/50 mb-4" />
				<h3 class="text-lg font-semibold mb-2">Browse the Collection</h3>
				<p class="text-muted-foreground text-sm mb-4 max-w-xs">
					Explore our curated collection of cocktail recipes.
				</p>
				<a href="/catalog/browse" class={buttonVariants({ variant: 'outline' })}>
					Browse All
					<ArrowRight class="h-4 w-4 ml-2" />
				</a>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<style>
	.bg-grid-pattern {
		background-image: radial-gradient(circle, currentColor 1px, transparent 1px);
		background-size: 24px 24px;
	}
</style>
