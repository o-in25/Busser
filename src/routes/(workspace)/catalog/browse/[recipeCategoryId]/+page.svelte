<script lang="ts">
	import type { PageData } from './$types';
	import CatalogBrowseCard from '$lib/components/CatalogBrowseCard.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import {
		ArrowLeft,
		LayoutGrid,
		List,
		FlaskConical,
	} from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	// View mode
	let viewMode = $state<'grid' | 'list'>('grid');

	// Restore view mode from localStorage
	onMount(() => {
		const savedViewMode = localStorage.getItem('catalog-browse-view-mode');
		if (savedViewMode === 'list' || savedViewMode === 'grid') {
			viewMode = savedViewMode;
		}
	});

	function setViewMode(mode: 'grid' | 'list') {
		viewMode = mode;
		if (browser) {
			localStorage.setItem('catalog-browse-view-mode', mode);
		}
	}
</script>

<svelte:head>
	<title>{data.spirit.recipeCategoryDescription} Cocktails - Catalog</title>
</svelte:head>

<div class="container mx-auto px-4 mt-4">
	<!-- Hero Section -->
	<div class="relative overflow-hidden rounded-xl mb-8">
		<!-- Background image -->
		{#if data.spirit.recipeCategoryDescriptionImageUrl}
			<div class="absolute inset-0">
				<img
					src={data.spirit.recipeCategoryDescriptionImageUrl}
					alt={data.spirit.recipeCategoryDescription}
					class="w-full h-full object-cover"
				/>
				<div class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40"></div>
			</div>
		{:else}
			<div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5"></div>
		{/if}

		<!-- Content -->
		<div class="relative px-6 py-12">
			<a href="/catalog/browse" class={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-4 gap-2")}>
				<ArrowLeft class="h-4 w-4" />
				All Recipes
			</a>

			<h1 class="text-3xl md:text-4xl font-bold mb-2">
				{data.spirit.recipeCategoryDescription} Cocktails
			</h1>

			{#if data.spirit.recipeCategoryDescriptionText}
				<p class="text-muted-foreground max-w-2xl mb-4">
					{data.spirit.recipeCategoryDescriptionText}
				</p>
			{/if}

			<Badge variant="secondary" class="text-sm">
				{data.recipes.length} {data.recipes.length === 1 ? 'recipe' : 'recipes'}
			</Badge>
		</div>
	</div>

	<!-- Other category quick filters -->
	<div class="flex flex-wrap gap-2 mb-6">
		{#each data.spirits as spirit}
			<a href="/catalog/browse/{spirit.recipeCategoryId}">
				<Badge
					variant={spirit.recipeCategoryId === data.spirit.recipeCategoryId ? "default" : "outline"}
					class="cursor-pointer hover:bg-accent transition-colors"
				>
					{spirit.recipeCategoryDescription}
				</Badge>
			</a>
		{/each}
	</div>

	<!-- Toolbar -->
	<div class="flex justify-between items-center mb-6">
		<p class="text-sm text-muted-foreground">
			Showing {data.recipes.length} {data.recipes.length === 1 ? 'recipe' : 'recipes'}
		</p>

		<!-- View Toggle -->
		<div class="flex items-center border rounded-md overflow-hidden">
			<button
				class={cn(
					"p-2 transition-colors",
					viewMode === 'grid' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
				)}
				onclick={() => setViewMode('grid')}
				aria-label="Grid view"
			>
				<LayoutGrid class="h-4 w-4" />
			</button>
			<button
				class={cn(
					"p-2 transition-colors",
					viewMode === 'list' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
				)}
				onclick={() => setViewMode('list')}
				aria-label="List view"
			>
				<List class="h-4 w-4" />
			</button>
		</div>
	</div>

	<!-- Results -->
	{#if data.recipes.length === 0}
		<Card.Root class="border-dashed">
			<Card.Content class="flex flex-col items-center justify-center py-16 text-center">
				<div class="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
					<FlaskConical class="h-10 w-10 text-muted-foreground/50" />
				</div>
				<h3 class="text-xl font-semibold mb-2">No {data.spirit.recipeCategoryDescription || 'Spirit'} Recipes</h3>
				<p class="text-muted-foreground mb-6 max-w-md">
					You haven't added any {(data.spirit.recipeCategoryDescription || 'spirit').toLowerCase()} cocktails yet.
				</p>
				<a href="/catalog/add" class={buttonVariants()}>
					Add Recipe
				</a>
			</Card.Content>
		</Card.Root>
	{:else}
		<div class={cn(
			viewMode === 'grid'
				? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
				: "flex flex-col gap-3"
		)}>
			{#each data.recipes as recipe (recipe.recipeId)}
				<CatalogBrowseCard {recipe} {viewMode} />
			{/each}
		</div>
	{/if}
</div>
