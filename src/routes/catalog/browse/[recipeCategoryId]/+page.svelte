<script lang="ts">
	import type { PageData } from './$types';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { CollapsibleSection } from '$lib/components/ui/collapsible';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import { cn } from '$lib/utils';
	import {
		Search,
		Plus,
		CheckCircle2,
		XCircle,
		BookOpen,
		Sparkles,
		Star,
		ArrowRight,
		GlassWater,
		FlaskConical,
		Filter,
		ChevronRight,
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getContext, onMount } from 'svelte';
	import type { CatalogGeneratorSchema } from '$lib/server/generators/catalog-generator';
	import placeholderLight from '$lib/assets/placeholder-alt-light.png';
	import placeholderDark from '$lib/assets/placeholder-alt-dark.png';

	let { data }: { data: PageData } = $props();
	const { spirit, recipes, relatedSpirits, signatureCocktails, recipeCount } = data;

	const permissions: string[] = getContext('permissions') || [];

	// AI-generated content state
	let content: CatalogGeneratorSchema | null = $state(null);
	let contentLoading = $state(true);

	// Search/filter state
	let searchQuery = $state('');
	let filteredRecipes = $derived(
		searchQuery.trim()
			? recipes.filter(r =>
				r.recipeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				r.recipeDescription?.toLowerCase().includes(searchQuery.toLowerCase())
			)
			: recipes
	);

	// Fetch AI-generated content
	onMount(async () => {
		if (spirit) {
			try {
				const result = await fetch(`/api/generator/catalog`, {
					method: 'POST',
					body: JSON.stringify({
						recipeName: spirit.recipeCategoryDescriptionText,
					}),
				});
				const response = await result.json();
				content = response;
			} catch (e) {
				console.error('Failed to load spirit info:', e);
			} finally {
				contentLoading = false;
			}
		}
	});
</script>

<svelte:head>
	<title>{spirit?.recipeCategoryDescription || 'Spirit'} - Busser</title>
</svelte:head>

<Breadcrumb name="Catalog" href="/catalog">
	<BreadcrumbItem name="Browse" href="/catalog/browse" />
	<BreadcrumbItem name={spirit?.recipeCategoryDescription || ''} />
</Breadcrumb>

{#if spirit}
	<!-- Hero Section -->
	<div class="relative rounded-xl overflow-hidden mb-8">
		<!-- Background Image -->
		<div class="absolute inset-0">
			<img
				src={spirit.recipeCategoryDescriptionImageUrl}
				alt={spirit.recipeCategoryDescription}
				class="w-full h-full object-cover"
			/>
			<div class="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60"></div>
		</div>

		<!-- Hero Content -->
		<div class="relative py-12 px-6 md:px-10 md:py-16">
			<div class="max-w-2xl">
				<Badge variant="secondary" class="mb-4">Base Spirit</Badge>
				<h1 class="text-4xl md:text-5xl font-bold mb-4">
					{spirit.recipeCategoryDescription}
				</h1>
				<p class="text-lg text-muted-foreground mb-6 leading-relaxed">
					{spirit.recipeCategoryDescriptionText}
				</p>

				<!-- Quick Stats -->
				<div class="flex flex-wrap gap-3">
					<Badge variant="outline" class="text-sm py-1.5 px-3">
						<FlaskConical class="h-4 w-4 mr-1.5" />
						{recipeCount} {recipeCount === 1 ? 'Recipe' : 'Recipes'}
					</Badge>

					<!-- Flavor Profile Tags (from AI) -->
					{#if content?.flavorProfile}
						{#each content.flavorProfile.slice(0, 4) as flavor}
							<Badge variant="secondary" class="text-sm py-1.5 px-3">
								{flavor}
							</Badge>
						{/each}
					{:else if contentLoading}
						<Skeleton class="h-8 w-20" />
						<Skeleton class="h-8 w-24" />
						<Skeleton class="h-8 w-16" />
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Signature Cocktails (if any) -->
	{#if signatureCocktails.length > 0}
		<section class="mb-10">
			<h2 class="text-2xl font-bold flex items-center gap-2 mb-6">
				<Star class="h-6 w-6 text-amber-500" />
				Signature {spirit.recipeCategoryDescription} Cocktails
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				{#each signatureCocktails as cocktail, i}
					<a href="/catalog/{cocktail.recipeId}" class="block group">
						<Card.Root class="relative overflow-hidden h-56 hover:shadow-lg transition-all duration-300">
							<!-- Background Image -->
							<div class="absolute inset-0">
								{#if cocktail.recipeImageUrl}
									<img
										src={cocktail.recipeImageUrl}
										alt={cocktail.recipeName}
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
									/>
								{:else}
									<div class="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
										<GlassWater class="h-16 w-16 text-primary/30" />
									</div>
								{/if}
								<div class="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"></div>
							</div>

							<!-- Signature badge -->
							{#if i === 0}
								<Badge class="absolute top-3 left-3 bg-amber-500 text-white">
									<Star class="h-3 w-3 mr-1" />
									Top Pick
								</Badge>
							{/if}

							<!-- Content -->
							<div class="absolute inset-0 p-5 flex flex-col justify-end">
								<h3 class="text-xl font-bold text-foreground mb-1">
									{cocktail.recipeName}
								</h3>
								<p class="text-sm text-muted-foreground line-clamp-2">
									{cocktail.recipeDescription || 'A classic cocktail'}
								</p>
							</div>

							<!-- Hover indicator -->
							<div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
								<div class="p-2 rounded-full bg-primary text-primary-foreground">
									<ArrowRight class="h-4 w-4" />
								</div>
							</div>
						</Card.Root>
					</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- Pairing Guide Section -->
	<section class="mb-10">
		<h2 class="text-2xl font-bold flex items-center gap-2 mb-6">
			<Sparkles class="h-6 w-6 text-primary" />
			Pairing Guide
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<!-- Good With Card -->
			<Card.Root class="border-green-500/20 bg-gradient-to-br from-green-500/5 to-transparent">
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-green-600 dark:text-green-400">
						<CheckCircle2 class="h-5 w-5" />
						Pairs Well With
					</Card.Title>
				</Card.Header>
				<Card.Content>
					{#if contentLoading}
						<div class="space-y-2">
							<Skeleton class="h-4 w-3/4" />
							<Skeleton class="h-4 w-2/3" />
							<Skeleton class="h-4 w-1/2" />
						</div>
					{:else if content?.goodWith}
						<ul class="space-y-2">
							{#each content.goodWith as item}
								<li class="flex items-center gap-2 text-muted-foreground">
									<CheckCircle2 class="h-4 w-4 text-green-500 shrink-0" />
									{item}
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-muted-foreground italic">No pairing information available.</p>
					{/if}
				</Card.Content>
			</Card.Root>

			<!-- Avoid With Card -->
			<Card.Root class="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
				<Card.Header class="pb-3">
					<Card.Title class="flex items-center gap-2 text-red-600 dark:text-red-400">
						<XCircle class="h-5 w-5" />
						Avoid Pairing With
					</Card.Title>
				</Card.Header>
				<Card.Content>
					{#if contentLoading}
						<div class="space-y-2">
							<Skeleton class="h-4 w-3/4" />
							<Skeleton class="h-4 w-2/3" />
							<Skeleton class="h-4 w-1/2" />
						</div>
					{:else if content?.avoidWith}
						<ul class="space-y-2">
							{#each content.avoidWith as item}
								<li class="flex items-center gap-2 text-muted-foreground">
									<XCircle class="h-4 w-4 text-red-500 shrink-0" />
									{item}
								</li>
							{/each}
						</ul>
					{:else}
						<p class="text-muted-foreground italic">No pairing information available.</p>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>
	</section>

	<!-- History Section (Collapsible) -->
	<section class="mb-10">
		<CollapsibleSection
			title={`History of ${spirit.recipeCategoryDescription}`}
			icon={BookOpen}
			open={true}
		>
			{#if contentLoading}
				<div class="space-y-3">
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-3/4" />
				</div>
			{:else if content?.history}
				<p class="text-muted-foreground leading-relaxed">
					{content.history}
				</p>
			{:else}
				<p class="text-muted-foreground italic">
					No historical information available for this spirit.
				</p>
			{/if}
		</CollapsibleSection>
	</section>

	<!-- All Cocktails Section -->
	<section class="mb-10">
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
			<h2 class="text-2xl font-bold flex items-center gap-2">
				<GlassWater class="h-6 w-6 text-primary" />
				All {spirit.recipeCategoryDescription} Cocktails
				<Badge variant="secondary">{filteredRecipes.length}</Badge>
			</h2>

			<!-- Search bar -->
			<div class="relative w-full sm:w-72">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
				<Input
					type="text"
					placeholder="Search cocktails..."
					bind:value={searchQuery}
					class="pl-10"
				/>
			</div>
		</div>

		{#if recipes.length === 0}
			<!-- Empty State -->
			<Card.Root class="border-dashed">
				<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
					<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
						<GlassWater class="h-10 w-10 text-muted-foreground/50" />
					</div>
					<h3 class="text-xl font-semibold mb-2">No Cocktails Yet</h3>
					<p class="text-muted-foreground mb-6 max-w-md">
						Be the first to add a {spirit.recipeCategoryDescription} cocktail to your collection!
					</p>
					{#if permissions.includes('add_catalog')}
						<a href="/catalog/add" class={buttonVariants()}>
							<Plus class="h-4 w-4 mr-2" />
							Add {spirit.recipeCategoryDescription} Cocktail
						</a>
					{/if}
				</Card.Content>
			</Card.Root>
		{:else if filteredRecipes.length === 0}
			<!-- No Search Results -->
			<Card.Root class="border-dashed">
				<Card.Content class="flex flex-col items-center justify-center py-12 text-center">
					<Search class="h-12 w-12 text-muted-foreground/50 mb-4" />
					<h3 class="text-lg font-semibold mb-2">No Results Found</h3>
					<p class="text-muted-foreground mb-4">
						No cocktails match "{searchQuery}"
					</p>
					<Button variant="outline" onclick={() => searchQuery = ''}>
						Clear Search
					</Button>
				</Card.Content>
			</Card.Root>
		{:else}
			<!-- Cocktail Grid -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each filteredRecipes as recipe}
					<a href="/catalog/{recipe.recipeId}" class="block group">
						<Card.Root class="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
							<!-- Image -->
							<div class="relative h-40 overflow-hidden">
								{#if recipe.recipeImageUrl}
									<img
										src={recipe.recipeImageUrl}
										alt={recipe.recipeName}
										class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
									/>
								{:else}
									<div class="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center dark:hidden">
										<img
											src={placeholderLight}
											alt={recipe.recipeName}
											class="w-20 h-20 object-contain opacity-50"
										/>
									</div>
									<div class="w-full h-full bg-gradient-to-br from-muted to-muted/50 items-center justify-center hidden dark:flex">
										<img
											src={placeholderDark}
											alt={recipe.recipeName}
											class="w-20 h-20 object-contain opacity-50"
										/>
									</div>
								{/if}
								<div class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
							</div>

							<!-- Content -->
							<Card.Content class="p-4">
								<h3 class="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
									{recipe.recipeName}
								</h3>
								<p class="text-sm text-muted-foreground line-clamp-2">
									{recipe.recipeDescription || 'A delicious cocktail recipe'}
								</p>
							</Card.Content>
						</Card.Root>
					</a>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Quick Add CTA (if user has permission) -->
	{#if permissions.includes('add_catalog') && recipes.length > 0}
		<section class="mb-10">
			<Card.Root class="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
				<Card.Content class="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
					<div class="text-center sm:text-left">
						<h3 class="text-lg font-bold mb-1">Got a new recipe?</h3>
						<p class="text-muted-foreground text-sm">
							Add another {spirit.recipeCategoryDescription} cocktail to your collection.
						</p>
					</div>
					<a href="/catalog/add" class={cn(buttonVariants(), "shrink-0")}>
						<Plus class="h-4 w-4 mr-2" />
						Add Recipe
					</a>
				</Card.Content>
			</Card.Root>
		</section>
	{/if}

	<!-- Related Spirits -->
	{#if relatedSpirits.length > 0}
		<section class="mb-10">
			<h2 class="text-2xl font-bold flex items-center gap-2 mb-6">
				Explore Other Spirits
			</h2>
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
				{#each relatedSpirits as relatedSpirit}
					<a href="/catalog/browse/{relatedSpirit.recipeCategoryId}" class="block group">
						<Card.Root class="relative overflow-hidden h-32 hover:shadow-lg transition-all duration-300">
							<div class="absolute inset-0">
								<img
									src={relatedSpirit.recipeCategoryDescriptionImageUrl}
									alt={relatedSpirit.recipeCategoryDescription}
									class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>
							</div>
							<div class="absolute inset-0 p-4 flex items-end">
								<span class="font-semibold text-foreground">
									{relatedSpirit.recipeCategoryDescription}
								</span>
							</div>
							<div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
								<ChevronRight class="h-5 w-5 text-primary" />
							</div>
						</Card.Root>
					</a>
				{/each}
			</div>
		</section>
	{/if}
{:else}
	<!-- Spirit not found -->
	<Card.Root class="border-dashed">
		<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
			<GlassWater class="h-16 w-16 text-muted-foreground/50 mb-4" />
			<h3 class="text-xl font-semibold mb-2">Spirit Not Found</h3>
			<p class="text-muted-foreground mb-6">
				The spirit category you're looking for doesn't exist.
			</p>
			<a href="/catalog" class={buttonVariants({ variant: "outline" })}>
				<ArrowRight class="h-4 w-4 mr-2 rotate-180" />
				Back to Catalog
			</a>
		</Card.Content>
	</Card.Root>
{/if}
