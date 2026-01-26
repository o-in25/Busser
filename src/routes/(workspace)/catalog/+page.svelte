<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { PageData } from './$types';
	import { cn } from '$lib/utils';
	import {
		ArrowRight,
		Search,
		Plus,
		Sparkles,
		BookOpen,
		GlassWater,
		Lightbulb,
		TrendingUp,
		FlaskConical,
		Star,
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getContext } from 'svelte';

	let { data }: { data: PageData } = $props();
	const {
		spirits,
		spiritCounts,
		recentCocktails,
		featuredCocktail,
		totalRecipes,
		popularSpirit,
	} = data.args;

	const permissions: string[] = getContext('permissions') || [];

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
			title: "The Fundamental Law of Cocktails",
			tip: "There is no chilling without dilution, and there is no dilution without chilling. The two are inextricably linked.",
			source: "Dave Arnold"
		},
		{
			title: "Perfect Stirring",
			tip: "Stir drinks for about 30 seconds with good ice. Stirred drinks should be silky and slightly less diluted than shaken ones.",
			source: "Classic Technique"
		},
		{
			title: "The Shake Test",
			tip: "Shake until the outside of your shaker is frosted and almost painfully cold to hold - usually 10-15 seconds.",
			source: "Classic Technique"
		},
		{
			title: "Ice Matters",
			tip: "Clear ice isn't just pretty - it's denser and melts slower, giving you better control over dilution in your drinks.",
			source: "Ice Science"
		},
		{
			title: "Fresh Citrus",
			tip: "Always use freshly squeezed citrus juice. The flavor degrades significantly after just a few hours.",
			source: "Classic Technique"
		},
	];

	// Pick a random tip
	const todaysTip = bartenderTips[Math.floor(Math.random() * bartenderTips.length)];
</script>

<svelte:head>
	<title>Catalog - Busser</title>
</svelte:head>

<!-- Hero Section -->
<div class="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-background to-primary/5 border border-primary/10 mb-8 mt-4">
	<div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
	<div class="relative px-6 py-10 md:py-14">
		<div class="max-w-2xl">
			<h1 class="text-4xl md:text-5xl font-bold mb-3">
				Cocktail Catalog
			</h1>
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
			<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border">
				<FlaskConical class="h-5 w-5 text-primary" />
				<div>
					<p class="text-2xl font-bold">{totalRecipes}</p>
					<p class="text-xs text-muted-foreground">Total Recipes</p>
				</div>
			</div>
			<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border">
				<GlassWater class="h-5 w-5 text-primary" />
				<div>
					<p class="text-2xl font-bold">{spirits.length}</p>
					<p class="text-xs text-muted-foreground">Spirit Categories</p>
				</div>
			</div>
			{#if popularSpirit}
				<div class="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/80 backdrop-blur-sm border">
					<TrendingUp class="h-5 w-5 text-primary" />
					<div>
						<p class="text-2xl font-bold">{popularSpirit.recipeCategoryDescription}</p>
						<p class="text-xs text-muted-foreground">Most Popular</p>
					</div>
				</div>
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
			class="text-sm font-medium hover:underline flex items-center text-muted-foreground hover:text-foreground transition-colors"
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
				<Card.Root class="relative overflow-hidden h-48 hover:shadow-lg transition-all duration-300">
					<!-- Background image -->
					<div class="absolute inset-0">
						<img
							src={spirit.recipeCategoryDescriptionImageUrl}
							alt={spirit.recipeCategoryDescription}
							class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
						/>
						<div class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
					</div>

					<!-- Content -->
					<div class="absolute inset-0 p-5 flex flex-col justify-end">
						<div class="flex items-center justify-between">
							<h3 class="text-xl font-bold text-foreground">
								{spirit.recipeCategoryDescription}
							</h3>
							<Badge variant="secondary" class="bg-background/80 backdrop-blur-sm">
								{count} {count === 1 ? 'recipe' : 'recipes'}
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
					<div class="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
						<Sparkles class="h-12 w-12 text-primary/40" />
					</div>
				{/if}
				<div class="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
				<Badge class="absolute top-3 left-3 bg-primary text-primary-foreground">
					<Star class="h-3 w-3 mr-1" />
					Featured
				</Badge>
			</div>
			<Card.Content class="pt-4">
				<h3 class="font-bold text-lg mb-1">{featuredCocktail.recipeName}</h3>
				<p class="text-sm text-muted-foreground mb-3">
					{featuredCocktail.recipeCategoryDescription}
				</p>
				<a
					href="/catalog/{featuredCocktail.recipeId}"
					class={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
				>
					View Recipe
					<ArrowRight class="ml-2 h-4 w-4" />
				</a>
			</Card.Content>
		</Card.Root>
	{/if}

	<!-- Recent Cocktails -->
	<Card.Root class={featuredCocktail ? "lg:col-span-2" : "lg:col-span-3"}>
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
					{#each recentCocktails.slice(0, 4) as cocktail}
						<a
							href="/catalog/{cocktail.recipeId}"
							class="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
						>
							<div class="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
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
							</div>
							<div class="flex-1 min-w-0">
								<p class="font-medium truncate group-hover:text-primary transition-colors">
									{cocktail.recipeName}
								</p>
								<p class="text-xs text-muted-foreground">
									{cocktail.recipeCategoryDescription}
								</p>
							</div>
							<ArrowRight class="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
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
	<Card.Root class="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
		<Card.Header>
			<Card.Title class="flex items-center gap-2 text-amber-600 dark:text-amber-400">
				<Lightbulb class="h-5 w-5" />
				Bartender's Tip
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<h4 class="font-semibold mb-2">{todaysTip.title}</h4>
			<p class="text-muted-foreground text-sm leading-relaxed mb-3">
				"{todaysTip.tip}"
			</p>
			<p class="text-xs text-muted-foreground/70 italic">
				— {todaysTip.source}
			</p>
		</Card.Content>
	</Card.Root>

	<!-- Add Recipe CTA -->
	{#if permissions.includes('add_catalog')}
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
				<a href="/catalog/browse" class={buttonVariants({ variant: "outline" })}>
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
