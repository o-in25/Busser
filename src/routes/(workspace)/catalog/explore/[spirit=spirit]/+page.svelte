<script lang="ts">
	import {
		ArrowRight,
		BookOpen,
		ChevronLeft,
		EllipsisVertical,
		ExternalLink,
		FlaskConical,
		Globe,
		Layers,
		Pencil,
		Plus,
	} from 'lucide-svelte';
	import { getContext } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import CatalogBrowseCard from '$lib/components/CatalogBrowseCard.svelte';
	import CatalogResultsSkeleton from '$lib/components/CatalogResultsSkeleton.svelte';
	import SpiritOverview from '$lib/components/SpiritOverview.svelte';
	import SpiritRegions from '$lib/components/SpiritRegions.svelte';
	import SpiritSources from '$lib/components/SpiritSources.svelte';
	import SpiritSubcategories from '$lib/components/SpiritSubcategories.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import CollapsibleSection from '$lib/components/ui/collapsible/collapsible.svelte';
	import { reveal } from '$lib/actions/reveal';
	import WorkspaceSwitcherBadge from '$lib/components/WorkspaceSwitcherBadge.svelte';
	import type { WorkspaceWithRole } from '$lib/server/repositories/workspace.repository';

	import type { PageData } from './$types';
	import FancyButton from '$lib/components/FancyButton.svelte';
	import { workspaceSwitching } from '../../../../../stores';

	let { data }: { data: PageData } = $props();

	const workspace = getContext<WorkspaceWithRole>('workspace');
	const canModify = workspace?.workspaceRole === 'owner' || workspace?.workspaceRole === 'editor';
	const authenticated = $derived(!!$page.data.user);

	// spirit category description/image is global — only admins may edit it
	const permissions: string[] = getContext('permissions') || [];
	const canEditCategory = permissions.includes('edit_admin');

	// track favorites/featured for optimistic updates
	let favorites = $state(new Set(data.favoriteRecipeIds));
	let featured = $state(new Set(data.featuredRecipeIds));

	// base path for this spirit's explore page
	const basePath = $derived(`/catalog/explore/${data.spiritContent.slug}`);

	// deep-link into the main catalog, pre-filtered to this spirit
	const catalogLink = $derived(`/catalog?spirit=${data.spirit.recipeCategoryId}`);

	const hex = $derived(data.spiritContent.accentColor.hex);

	// hero image: featured recipe from the category, falling back to the category's own image
	const heroImage = $derived(data.spotlightImage ?? data.spirit.recipeCategoryDescriptionImageUrl);

	// json-ld ItemList of every recipe in the category — keeps the full listing crawlable
	// even though the page only renders a preview strip
	const SITE = 'https://busserapp.com';
	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'ItemList',
			name: `${data.spiritContent.displayName} Cocktails`,
			numberOfItems: data.totalCount,
			itemListElement: data.recipeIndex.map((r, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: r.recipeName,
				url: `${SITE}/catalog/${r.recipeId}`,
			})),
		})
	);

	// update local state when page data changes
	$effect(() => {
		favorites = new Set(data.favoriteRecipeIds);
		featured = new Set(data.featuredRecipeIds);
	});

	function handleToggleFavorite(id: number) {
		const newFavorites = new Set(favorites);
		if (newFavorites.has(id)) {
			newFavorites.delete(id);
		} else {
			newFavorites.add(id);
		}
		favorites = newFavorites;
	}

	function handleToggleFeatured(id: number) {
		const newFeatured = new Set(featured);
		if (newFeatured.has(id)) {
			newFeatured.delete(id);
		} else {
			newFeatured.add(id);
		}
		featured = newFeatured;
	}
</script>

<svelte:head>
	<title>{data.spiritContent.displayName} - Spirit Guide</title>
	<meta
		name="description"
		content="Explore {data.spiritContent
			.displayName} cocktail recipes. Learn about the spirit's history, subcategories, and geographic origins."
	/>
	<meta property="og:title" content="{data.spiritContent.displayName} Spirit Guide - Busser" />
	<meta
		property="og:description"
		content="Explore {data.spiritContent.displayName} cocktail recipes and learn about the spirit."
	/>
	<meta property="og:type" content="website" />
	<meta
		property="og:url"
		content="https://busserapp.com/catalog/explore/{data.spiritContent.slug}"
	/>
	<meta
		property="og:image"
		content={data.spirit.recipeCategoryDescriptionImageUrl || 'https://busserapp.com/og-image.png'}
	/>
	<meta name="twitter:card" content="summary_large_image" />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${jsonLd}</` + `script>`}
</svelte:head>

<div class="container mx-auto px-4 mt-4 relative overflow-hidden">
	<!-- floating decorative orbs -->
	<div class="spirit-orb spirit-orb-1" style="background: {hex}"></div>
	<div class="spirit-orb spirit-orb-2" style="background: {hex}"></div>

	<!-- Desktop toolbar above hero -->
	<div class="hidden md:flex items-center justify-between mb-4 mt-4">
		<FancyButton href="/catalog/explore" size="sm">
			<ChevronLeft class="h-4 w-4 mr-1" />
			Back to Explore
		</FancyButton>
		<div class="flex items-center gap-2">
			{#if canModify || canEditCategory}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class="glass-cta glass-cta-sm">
						<EllipsisVertical class="h-4 w-4 mr-1" />
						More
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						{#if canModify}
							<DropdownMenu.Item onclick={() => goto('/catalog/add')}>
								<Plus class="h-4 w-4 mr-2" />
								Add recipe
							</DropdownMenu.Item>
						{/if}
						{#if canEditCategory}
							<DropdownMenu.Item onclick={() => goto(`${basePath}/edit`)}>
								<Pencil class="h-4 w-4 mr-2" />
								Edit category
							</DropdownMenu.Item>
						{/if}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			{/if}
		</div>
	</div>

	<!-- Hero Section -->
	<div class="relative overflow-hidden rounded-xl mb-8 mt-4 md:mt-0">
		{#if heroImage}
			<div class="absolute inset-0">
				<img
					src={heroImage}
					alt={data.spiritContent.displayName}
					class="w-full h-full object-cover"
				/>
				<div
					class="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/50"
				></div>
			</div>
		{:else}
			<div
				class="absolute inset-0 bg-gradient-to-br {data.spiritContent.accentColor.gradient}"
			></div>
		{/if}

		<div class="relative px-4 pt-10 md:pt-16 pb-4 sm:px-6 md:pt-20 sm:pb-5 flex flex-col gap-3">
			<h1 class="text-3xl sm:text-4xl font-bold">{data.spiritContent.displayName}</h1>

			<!-- Mobile buttons inside hero -->
			<div class="flex gap-2 md:hidden">
				<FancyButton
					href="/catalog/explore"
					size="sm"
					class="flex-1 justify-center whitespace-nowrap"
				>
					<ChevronLeft class="h-4 w-4 mr-1" />
					Back
				</FancyButton>

				{#if canModify || canEditCategory}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class="glass-cta glass-cta-sm shrink-0">
							<EllipsisVertical class="h-4 w-4" />
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							{#if canModify}
								<DropdownMenu.Item onclick={() => goto('/catalog/add')}>
									<Plus class="h-4 w-4 mr-2" />
									Add recipe
								</DropdownMenu.Item>
							{/if}
							{#if canEditCategory}
								<DropdownMenu.Item onclick={() => goto(`${basePath}/edit`)}>
									<Pencil class="h-4 w-4 mr-2" />
									Edit category
								</DropdownMenu.Item>
							{/if}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				{/if}
			</div>
		</div>
	</div>

	<!-- Spirit Guide (educational content) — the heart of the page -->
	<div id="spirit-guide" class="scroll-mt-4 mb-12">
		<h2 class="text-2xl font-bold flex items-center gap-2 mb-6">
			<BookOpen class="h-5 w-5 text-primary" />
			{data.spiritContent.displayName} Spirit Guide
		</h2>

		<div class="space-y-4">
			<div class="reveal-on-scroll" use:reveal>
				<CollapsibleSection title="History & Production" icon={BookOpen} open={true}>
					<SpiritOverview
						overview={data.spiritContent.overview}
						funFact={data.spiritContent.funFact}
						accentColor={data.spiritContent.accentColor}
					/>
				</CollapsibleSection>
			</div>

			<div class="reveal-on-scroll" use:reveal={{ delay: 100 }}>
				<CollapsibleSection title="Styles & Varieties" icon={Layers} open={false}>
					<SpiritSubcategories
						subcategories={data.spiritContent.subcategories}
						accentColor={data.spiritContent.accentColor}
					/>
				</CollapsibleSection>
			</div>

			<div class="reveal-on-scroll" use:reveal={{ delay: 200 }}>
				<CollapsibleSection title="Geographic Origins" icon={Globe} open={false}>
					<SpiritRegions
						regions={data.spiritContent.regions}
						accentColor={data.spiritContent.accentColor}
					/>
				</CollapsibleSection>
			</div>

			<div class="reveal-on-scroll" use:reveal={{ delay: 300 }}>
				<CollapsibleSection title="Sources & References" icon={ExternalLink} open={false}>
					<SpiritSources sources={data.spiritContent.sources} />
				</CollapsibleSection>
			</div>
		</div>
	</div>

	<!-- Recipe Preview Section — the payoff: now go make something with what you learned -->
	<section class="mb-12">
		<div class="flex flex-col gap-3 mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
			<div>
				<h2 class="text-2xl font-bold">Now Make One</h2>
				<p class="text-muted-foreground">
					{data.totalCount}
					{data.totalCount === 1 ? 'recipe' : 'recipes'} to try
				</p>
			</div>
			<div class="flex items-center gap-2 shrink-0">
				<WorkspaceSwitcherBadge variant="pill" />
				{#if data.totalCount > 0}
					<FancyButton href={catalogLink} variant="primary" size="sm" class="whitespace-nowrap">
						View all
						<ArrowRight class="h-4 w-4 ml-1" />
					</FancyButton>
				{/if}
			</div>
		</div>

		{#if $workspaceSwitching}
			<CatalogResultsSkeleton viewMode="grid" count={data.recipes.length || 6} />
		{:else if data.recipes.length === 0}
			<Card.Root class="border-dashed">
				<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
					<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
						<FlaskConical class="h-10 w-10 text-muted-foreground/50" />
					</div>
					<h3 class="text-xl font-semibold mb-2">No {data.spiritContent.displayName} Recipes</h3>
					<p class="text-muted-foreground mb-6 max-w-md">
						You haven't added any {data.spiritContent.displayName.toLowerCase()} cocktails yet.
					</p>
					{#if canModify}
						<a href="/catalog/add" class={buttonVariants()}>Add Recipe</a>
					{/if}
				</Card.Content>
			</Card.Root>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each data.recipes as recipe (recipe.recipeId)}
					<CatalogBrowseCard
						{recipe}
						viewMode="grid"
						isFavorite={favorites.has(recipe.recipeId)}
						isFeatured={featured.has(recipe.recipeId)}
						{canModify}
						{authenticated}
						workspaceId={workspace.workspaceId}
						actionPath="?"
						onToggleFavorite={handleToggleFavorite}
						onToggleFeatured={handleToggleFeatured}
					/>
				{/each}
			</div>

			{#if data.totalCount > data.recipes.length}
				<div class="mt-6 flex justify-center">
					<FancyButton href={catalogLink} size="sm">
						View all {data.totalCount}
						{data.spiritContent.displayName} cocktails
						<ArrowRight class="h-4 w-4 ml-1" />
					</FancyButton>
				</div>
			{/if}
		{/if}

		<!-- full crawlable listing for no-js clients; hidden for everyone else (json-ld covers the rest) -->
		{#if data.recipeIndex.length > 0}
			<noscript>
				<h3>All {data.spiritContent.displayName} cocktails</h3>
				<ul>
					{#each data.recipeIndex as recipe (recipe.recipeId)}
						<li><a href="/catalog/{recipe.recipeId}">{recipe.recipeName}</a></li>
					{/each}
				</ul>
			</noscript>
		{/if}
	</section>
</div>

<style>
	.spirit-orb {
		position: absolute;
		width: 20rem;
		height: 20rem;
		border-radius: 9999px;
		opacity: 0.08;
		filter: blur(64px);
		pointer-events: none;
		z-index: 0;
	}

	.spirit-orb-1 {
		top: 15%;
		right: -5%;
		animation: spirit-float-1 12s ease-in-out infinite;
	}

	.spirit-orb-2 {
		bottom: 20%;
		left: -8%;
		animation: spirit-float-2 16s ease-in-out infinite;
	}

	@keyframes spirit-float-1 {
		0%,
		100% {
			transform: translate(0, 0);
		}
		33% {
			transform: translate(30px, -20px);
		}
		66% {
			transform: translate(-20px, 15px);
		}
	}

	@keyframes spirit-float-2 {
		0%,
		100% {
			transform: translate(0, 0);
		}
		33% {
			transform: translate(-25px, 20px);
		}
		66% {
			transform: translate(15px, -25px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spirit-orb {
			animation: none !important;
		}
	}

	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
