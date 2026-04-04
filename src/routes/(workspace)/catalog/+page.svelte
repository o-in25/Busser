<script lang="ts">
	import {
		ArrowRight,
		Award,
		BookOpen,
		Candy,
		Droplets,
		FlaskConical,
		Gauge,
		GlassWater,
		Globe,
		Heart,
		Lightbulb,
		Plus,
		Search,
		ShoppingCart,
		Shuffle,
		Sparkles,
		Star,
		TrendingUp,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { idToSlug } from '$lib/spirits';
	import FancyAlert from '$lib/components/FancyAlert.svelte';
	import FancyBadge from '$lib/components/FancyBadge.svelte';
	import FancyButton from '$lib/components/FancyButton.svelte';
	import FancyInput from '$lib/components/FancyInput.svelte';
	import CocktailOfTheDay from '$lib/components/CocktailOfTheDay.svelte';
	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import tips from '$lib/data/tips.json';
	import { cn } from '$lib/utils';

	import type { PageData } from './$types';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';
	import { workspaceSwitcherOpen } from '../../../stores';

	let { data }: { data: PageData } = $props();
	const {
		spirits,
		spiritCounts,
		recentCocktails,
		featuredCocktails,
		cocktailOfTheDay,
		favoriteRecipes,
		totalRecipes,
		popularSpirit,
		availableCount,
		almostThereCount,
		topIngredient,
		favoriteRecipeIds,
		featuredRecipeIds,
	} = data.args;

	// Track favorite/featured state locally for optimistic updates
	let favorites = $state(new Set(favoriteRecipeIds));
	let featured = $state(new Set(featuredRecipeIds));

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';
	const isGlobalCatalog = $page.data.isGlobalWorkspace;
	const authenticated = $derived(!!$page.data.user);

	// recipe list tab state
	let activeTab = $state<'featured' | 'favorites' | 'recent'>('featured');
	const tabRecipes = $derived.by(() => {
		if (activeTab === 'favorites') return favoriteRecipes;
		if (activeTab === 'recent') return recentCocktails;
		return featuredCocktails;
	});

	function surpriseMe() {
		const all = [...recentCocktails, ...featuredCocktails];
		if (all.length === 0) return;
		const pick = all[Math.floor(Math.random() * all.length)];
		goto(`/catalog/${pick.recipeId}`);
	}

	// Search state
	let searchQuery = $state('');

	function handleSearch(e: Event) {
		e.preventDefault();
		if (searchQuery.trim()) {
			goto(`/catalog/browse?search=${encodeURIComponent(searchQuery.trim())}`);
		}
	}

	// Bartender tips - rotating educational content
	const bartenderTips: { title: string; tip: string; source: string }[] = tips;

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
	<meta name="description" content="Browse our curated collection of classic and modern cocktail recipes. Find your next favorite drink." />
	<meta property="og:title" content="Cocktail Catalog - Busser" />
	<meta property="og:description" content="Browse our curated collection of classic and modern cocktail recipes." />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://busserapp.com/catalog" />
	<meta property="og:image" content="https://busserapp.com/og-image.png" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

{#if isGlobalCatalog && workspace?.workspaceRole !== 'owner'}
	<FancyAlert class="mb-6 mt-4">
		{#snippet icon()}<Globe class="h-5 w-5 text-primary" />{/snippet}
		{#snippet children()}
			<p class="sm:hidden">Viewing global catalog</p>
			<p class="hidden sm:block">You're viewing <strong>Busser's global catalog</strong>. To manage your own inventory, switch to your workspace.</p>
		{/snippet}
		{#snippet action()}
			<FancyButton size="sm" onclick={() => ($workspaceSwitcherOpen = true)}>Switch</FancyButton>
		{/snippet}
	</FancyAlert>
{/if}

<!-- Desktop toolbar above hero -->
<div class="hidden md:flex items-center justify-end gap-2 mb-4 mt-4">
	<FancyButton onclick={surpriseMe} size="sm">
		<Shuffle class="h-4 w-4 mr-1" />
		Surprise Me
	</FancyButton>
	<FancyButton href="/catalog/browse" variant="primary" size="sm">
		<ArrowRight class="h-4 w-4 mr-1" />
		View All
	</FancyButton>
</div>

<!-- Hero Section -->
<div
	class="rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-8 mt-4 md:mt-0 px-4 py-4 sm:px-6 sm:py-5"
>
	<!-- Title + Search -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
		<h1 class="text-2xl font-bold">Catalog</h1>
		<form onsubmit={handleSearch} class="flex gap-2 w-full sm:max-w-xs sm:w-auto">
			<div class="relative flex-1">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
				<FancyInput
					type="text"
					placeholder="Search cocktails..."
					bind:value={searchQuery}
					class="pl-10"
				/>
			</div>
			<FancyButton type="submit" size="sm">Search</FancyButton>
		</form>
	</div>

	<!-- Mobile: Surprise Me + View All -->
	<div class="flex gap-2 md:hidden mb-4">
		<FancyButton onclick={surpriseMe} size="sm" class="flex-1 justify-center">
			<Shuffle class="h-4 w-4 mr-1" />
			Surprise Me
		</FancyButton>
		<FancyButton href="/catalog/browse" variant="primary" size="sm" class="flex-1 justify-center">
			<ArrowRight class="h-4 w-4 mr-1" />
			View All
		</FancyButton>
	</div>

	<!-- Desktop: Smart Action Pills -->
	<div class="hidden md:flex gap-2 flex-wrap pb-1 -mb-1">
		<FancyBadge href="/catalog/browse" class="whitespace-nowrap">
			<FlaskConical class="h-4 w-4 text-primary shrink-0" />
			<span class="text-sm font-bold">{totalRecipes}</span>
			<span class="text-xs text-muted-foreground">Recipes</span>
		</FancyBadge>

		{#if !isGlobalCatalog}
			<FancyBadge href="/catalog/browse?readyToMake=true" class="whitespace-nowrap">
				<Sparkles class="h-4 w-4 text-primary shrink-0" />
				<span class="text-sm font-bold">{availableCount}</span>
				<span class="text-xs text-muted-foreground">Ready</span>
			</FancyBadge>

			{#if almostThereCount > 0}
				<FancyBadge href="/catalog/browse?almostThere=true" class="whitespace-nowrap">
					<GlassWater class="h-4 w-4 text-primary shrink-0" />
					<span class="text-sm font-bold">{almostThereCount}</span>
					<span class="text-xs text-muted-foreground">Almost There</span>
				</FancyBadge>
			{/if}
		{/if}

		{#if popularSpirit}
			<FancyBadge
				href="/catalog/browse/{idToSlug[popularSpirit.recipeCategoryId] ??
					popularSpirit.recipeCategoryId}"
				class="whitespace-nowrap"
			>
				<TrendingUp class="h-4 w-4 text-primary shrink-0" />
				<span class="text-sm font-bold truncate">{popularSpirit.recipeCategoryDescription}</span>
				<span class="text-xs text-muted-foreground">Most Popular</span>
			</FancyBadge>
		{:else}
			<FancyBadge class="whitespace-nowrap">
				<TrendingUp class="h-4 w-4 text-muted-foreground shrink-0" />
				<span class="text-sm font-bold">&mdash;</span>
				<span class="text-xs text-muted-foreground">Most Popular</span>
			</FancyBadge>
		{/if}

		{#if topIngredient && !isGlobalCatalog}
			<FancyBadge href="/inventory" class="whitespace-nowrap">
				<ShoppingCart class="h-4 w-4 text-primary shrink-0" />
				<span class="text-sm font-bold">+{topIngredient.unlockableRecipes}</span>
				<span class="text-xs text-muted-foreground">Buy {topIngredient.ingredientName}</span>
			</FancyBadge>
		{/if}
	</div>
</div>

<!-- Spirit Cards Section -->
<section class="mb-10">
	<div class="flex items-center justify-between mb-6">
		<h2 class="text-2xl font-bold flex items-center gap-2">
			<GlassWater class="h-6 w-6 text-primary" />
			Explore by Spirit
		</h2>
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
		{#each spirits as spirit}
			{@const count = spiritCounts[spirit.recipeCategoryId] || 0}
			<a
				href="/catalog/browse/{idToSlug[spirit.recipeCategoryId] ?? spirit.recipeCategoryId}"
				class="block group"
			>
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

</section>

<!-- Cocktail of the Day + Recipe List -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
	<!-- Cocktail of the Day -->
	{#if cocktailOfTheDay}
		<div class="lg:col-span-1">
			<CocktailOfTheDay recipe={cocktailOfTheDay} />
		</div>
	{/if}

	<!-- Tabbed Recipe List -->
	<Card.Root class={cocktailOfTheDay ? 'lg:col-span-2' : 'lg:col-span-3'}>
		<Card.Header>
			<div class="flex items-center gap-2">
				<div class="inline-flex items-center rounded-full backdrop-blur-xl bg-white/10 dark:bg-zinc-800/30 shadow-lg shadow-black/5 dark:shadow-black/15 p-0.5 text-muted-foreground">
					<button
						class={cn(
							'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
							activeTab === 'featured'
								? 'bg-primary/25 dark:bg-primary/20 text-primary dark:text-[rgba(248,78,128,1)] backdrop-blur-sm ring-1 ring-primary/30 shadow-[0_0_12px_rgba(248,78,128,0.25)]'
								: 'hover:bg-white/10 dark:hover:bg-zinc-700/25 hover:text-foreground'
						)}
						onclick={() => (activeTab = 'featured')}
					>
						<Star class="h-3 w-3 inline-block mr-1 -mt-0.5" />
						Featured
					</button>
					{#if authenticated}
						<button
							class={cn(
								'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
								activeTab === 'favorites'
									? 'bg-primary/25 dark:bg-primary/20 text-primary dark:text-[rgba(248,78,128,1)] backdrop-blur-sm ring-1 ring-primary/30 shadow-[0_0_12px_rgba(248,78,128,0.25)]'
									: 'hover:bg-white/10 dark:hover:bg-zinc-700/25 hover:text-foreground'
							)}
							onclick={() => (activeTab = 'favorites')}
						>
							<Heart class="h-3 w-3 inline-block mr-1 -mt-0.5" />
							Favorites
						</button>
					{/if}
					<button
						class={cn(
							'px-3 py-1 rounded-full text-xs font-medium transition-all duration-200',
							activeTab === 'recent'
								? 'bg-primary/25 dark:bg-primary/20 text-primary dark:text-[rgba(248,78,128,1)] backdrop-blur-sm ring-1 ring-primary/30 shadow-[0_0_12px_rgba(248,78,128,0.25)]'
								: 'hover:bg-white/10 dark:hover:bg-zinc-700/25 hover:text-foreground'
						)}
						onclick={() => (activeTab = 'recent')}
					>
						<BookOpen class="h-3 w-3 inline-block mr-1 -mt-0.5" />
						Recent
					</button>
				</div>
			</div>
		</Card.Header>
		<Card.Content>
			{#if tabRecipes.length === 0}
				<p class="text-muted-foreground text-center py-8">
					{#if activeTab === 'favorites'}
						No favorites yet. Browse recipes and tap the heart to save your favorites.
					{:else if activeTab === 'featured'}
						No featured cocktails yet.
					{:else}
						No recipes yet.
					{/if}
				</p>
			{:else}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					{#each tabRecipes.slice(0, 6) as cocktail (cocktail.recipeId)}
						<a
							href="/catalog/{cocktail.recipeId}"
							class="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
						>
							<div class="shrink-0">
								<SkeletonImage
									src={cocktail.recipeImageUrl}
									alt={cocktail.recipeName}
									variant="recipe"
									class="w-12 h-12 rounded-lg"
								/>
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium truncate group-hover:text-accent-foreground transition-colors">
									{cocktail.recipeName}
								</p>
								<p class="text-xs text-muted-foreground group-hover:text-accent-foreground/70 transition-colors">
									{cocktail.recipeCategoryDescription}
								</p>
							</div>
						</a>
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
		class="bg-gradient-to-br from-neon-amber-500/10 to-neon-amber-500/5 border-neon-amber-500/20 cursor-pointer hover:border-neon-amber-500/40 transition-colors"
		onclick={showNewTip}
	>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-neon-amber-600 dark:text-neon-amber-400">
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
			<p class="text-xs text-neon-amber-600/50 dark:text-neon-amber-400/50 mt-3">
				Click for another tip
			</p>
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
				<FancyButton href="/catalog/add" variant="primary" size="md">
					<Plus class="h-4 w-4 mr-2" />
					Add Recipe
				</FancyButton>
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

<!-- Verdict Explanation -->
<section id="verdict" class="mb-10 scroll-mt-20">
	<Card.Root>
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-lg">
				<Award class="h-5 w-5 text-primary" />
				How the Verdict Works
			</Card.Title>
			<Card.Description>
				The Verdict is a 0–10 score that reflects how well-crafted and balanced a cocktail is.
				Cocktails with intentional sweet/dry contrast earn a bonus, while one-dimensional or
				contradictory profiles lose points.
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="flex items-start gap-3 p-3 rounded-lg bg-primary-500/10 border border-primary-500/20">
					<Candy class="h-4 w-4 text-primary-500 mt-0.5 shrink-0" />
					<div>
						<p class="text-sm font-medium">Sweetness</p>
						<p class="text-xs text-muted-foreground">
							A measure of sugar presence. Most cocktails feature a sweetening agent for brightness
							and pop — too much is cloying, too little reduces the drink to spirits on the rocks.
						</p>
					</div>
				</div>
				<div class="flex items-start gap-3 p-3 rounded-lg bg-neon-amber-500/10 border border-neon-amber-500/20">
					<Droplets class="h-4 w-4 text-neon-amber-500 mt-0.5 shrink-0" />
					<div>
						<p class="text-sm font-medium">Dryness</p>
						<p class="text-xs text-muted-foreground">
							A measure of bitterness, tartness, and astringency. Dryness is the opposing force to
							sweetness — well-groomed cocktails have a counter-punch to bite through the sugar.
						</p>
					</div>
				</div>
				<div class="flex items-start gap-3 p-3 rounded-lg bg-neon-amber-500/10 border border-neon-amber-500/20">
					<Gauge class="h-4 w-4 text-neon-amber-500 mt-0.5 shrink-0" />
					<div>
						<p class="text-sm font-medium">Strength</p>
						<p class="text-xs text-muted-foreground">
							How well the alcohol integrates with other flavors, not just volume. The base spirit
							should be present without overstaying its welcome.
						</p>
					</div>
				</div>
				<div class="flex items-start gap-3 p-3 rounded-lg bg-secondary-500/10 border border-secondary-500/20">
					<Sparkles class="h-4 w-4 text-secondary-500 mt-0.5 shrink-0" />
					<div>
						<p class="text-sm font-medium">Versatility</p>
						<p class="text-xs text-muted-foreground">
							How flexible a recipe is — the most important factor. Highly versatile drinks have
							interchangeable parts and countless spin-offs, making them vital for tending bar.
						</p>
					</div>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</section>

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
