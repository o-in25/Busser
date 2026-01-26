<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { cn } from '$lib/utils';
	import type { PageData, ActionData } from './$types';
	import { page } from '$app/stores';
	import {
		LogIn,
		ArrowRight,
		Mail,
		GlassWater,
		FlaskConical,
		Package,
		Sparkles,
		BookOpen,
		Plus,
		Shuffle,
		TrendingUp,
		ShoppingCart,
		ChevronRight,
		CheckCircle2,
		AlertCircle,
		Camera,
		Send,
		Loader2,
	} from 'lucide-svelte';
	import { fade, fly } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import placeholder from '$lib/assets/placeholder@2x.jpg';
	import logo from '$lib/assets/logo.png';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Invitation request modal state
	let requestModalOpen = $state(false);
	let isSubmitting = $state(false);
	let requestSuccess = $state(false);

	// Form error state - cast to handle the union type properly
	let requestInviteForm = $derived(form?.requestInvite as { error?: string; email?: string; message?: string } | undefined);

	const { recipes, spirits, dashboardData, landingData } = data;

	// workspace role determines resource access (viewer can only read)
	const workspaceRole = dashboardData?.workspaceRole;
	const canModify = workspaceRole === 'owner' || workspaceRole === 'editor';

	// Gallery setup for authenticated users
	const gallery = recipes?.map(({
		recipeImageUrl,
		recipeName,
		recipeCategoryDescription,
		recipeId,
		recipeCategoryId,
		recipeDescription,
	}) => ({
		src: recipeImageUrl || placeholder,
		alt: recipeName,
		hasImage: !!recipeImageUrl,
		data: {
			recipeCategoryDescription,
			recipeId,
			recipeCategoryId,
			recipeDescription,
		},
	})) || [];

	// Filter state for gallery
	let sortBy: string | number = $state('all');
	let filter = $derived(
		sortBy === 'all'
			? gallery
			: gallery.filter((item: any) => item.data.recipeCategoryId === sortBy)
	);

	const setFilterType = (type: any) => {
		if (type !== sortBy) {
			sortBy = type;
		}
	};

	const hasAny = (spiritId: number) =>
		gallery.filter((item: any) => item.data.recipeCategoryId === spiritId).length < 1;

	// Surprise me - pick random available recipe
	function surpriseMe() {
		if (gallery.length === 0) return;
		const randomRecipe = gallery[Math.floor(Math.random() * gallery.length)];
		goto(`/catalog/${randomRecipe.data.recipeId}`);
	}

	// Features for landing page
	const features = [
		{
			icon: Package,
			title: 'Track Inventory',
			description: 'Keep track of what bottles and ingredients you have on hand.',
			comingSoon: false,
		},
		{
			icon: FlaskConical,
			title: 'Smart Catalog',
			description: 'See which cocktails you can make based on your current inventory.',
			comingSoon: false,
		},
		{
			icon: Camera,
			title: 'Bottle Scanner',
			description: 'Take a photo of a bottle to quickly add it to your inventory.',
			comingSoon: true,
		},
		{
			icon: Sparkles,
			title: 'AI Substitutions',
			description: 'Get suggestions for ingredient swaps when you\'re missing something.',
			comingSoon: true,
		},
	];

</script>

<svelte:head>
	<title>Home - Busser</title>
</svelte:head>

{#if !$page.data.user}
	<!-- ==================== UNAUTHENTICATED LANDING PAGE ==================== -->

	<!-- Hero Section -->
	<section class="relative overflow-hidden py-12 md:py-18 rounded-2xl mt-4">
		<!-- Background gradient -->
		<div class="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-orange-500/10 -z-10 rounded-2xl"></div>
		<div class="absolute inset-0 bg-grid-pattern opacity-5 -z-10"></div>

		<div class="max-w-4xl mx-auto text-center px-4">
			<!-- Logo -->
			<img src={logo} alt="Busser" class="h-40 md:h-52 lg:h-60 mx-auto mb-8" />

			<!-- Headline -->
			<h1 class="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
				From Shelf To
				<span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500">
					Shaker
				</span>
			</h1>

			<!-- Subheadline -->
			<p class="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
				Busser finds recipes that match your on-hand ingredients, no guesswork needed.
			</p>

			<!-- CTAs -->
			<div class="flex flex-col sm:flex-row justify-center gap-4">
				<a
					class={cn(buttonVariants({ size: "lg" }), "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white border-0 text-lg px-8")}
					href="/signup"
				>
					<Mail class="w-5 h-5 mr-2" />
					Sign Up
				</a>
				<a
					class={cn(buttonVariants({ variant: "outline", size: "lg" }), "text-lg px-8")}
					href="/login"
				>
					<LogIn class="w-5 h-5 mr-2" />
					Log In
				</a>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-16 px-4">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-12">
				<h2 class="text-3xl md:text-4xl font-bold mb-4">Features</h2>
				<p class="text-muted-foreground text-lg max-w-2xl mx-auto">
					Tools to help you manage your home bar.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{#each features as feature}
					<Card.Root class="text-center p-6 hover:shadow-lg transition-shadow relative">
						{#if feature.comingSoon}
							<Badge variant="secondary" class="absolute top-3 right-3 text-xs">
								Coming Soon
							</Badge>
						{/if}
						<div class="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
							<feature.icon class="h-7 w-7 text-purple-500" />
						</div>
						<h3 class="font-bold text-lg mb-2">{feature.title}</h3>
						<p class="text-muted-foreground text-sm">{feature.description}</p>
					</Card.Root>
				{/each}
			</div>
		</div>
	</section>

	<!-- Preview Gallery Section -->
	{#if landingData?.featuredRecipes && landingData.featuredRecipes.length > 0}
		<section class="py-16 px-4">
			<div class="max-w-6xl mx-auto">
				<div class="text-center mb-12">
					<h2 class="text-3xl md:text-4xl font-bold mb-4">Sample Recipes</h2>
					<p class="text-muted-foreground text-lg">
						A few cocktails from the catalog
					</p>
				</div>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
					{#each landingData.featuredRecipes as recipe}
						<Card.Root class="overflow-hidden group">
							<div class="relative aspect-square">
								<img
									src={recipe.recipeImageUrl}
									alt={recipe.recipeName}
									class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
								<div class="absolute bottom-0 left-0 right-0 p-4">
									<p class="font-bold text-foreground">{recipe.recipeName}</p>
									<p class="text-xs text-muted-foreground">{recipe.recipeCategoryDescription}</p>
								</div>
							</div>
						</Card.Root>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Final CTA Section -->
	<section class="py-16 px-4">
		<div class="max-w-3xl mx-auto text-center">
			<div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-8 md:p-12">
				<div class="absolute inset-0 bg-grid-pattern opacity-10"></div>
				<div class="relative">
					<h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
						Get Started
					</h2>
					<p class="text-white/80 text-lg mb-8">
						Create an account to start tracking your bar.
					</p>
					<a
						href="/signup"
						class={cn(buttonVariants({ size: "lg" }), "bg-white text-purple-600 hover:bg-white/90 text-lg px-8")}
					>
						Sign Up
						<ArrowRight class="ml-2 h-5 w-5" />
					</a>
				</div>
			</div>

			<!-- Invitation notice with request option -->
			<div class="mt-6 space-y-2">
				<p class="text-muted-foreground text-sm">
					Busser is currently invitation-only while we're in early development.
				</p>
				<button
					type="button"
					onclick={() => requestModalOpen = true}
					class="text-sm text-primary hover:underline"
				>
					Don't have an invite? Request one here.
				</button>
			</div>
		</div>
	</section>

	<!-- Request Invite Modal -->
	<Dialog.Root bind:open={requestModalOpen}>
		<Dialog.Content class="sm:max-w-md">
			<Dialog.Header>
				<Dialog.Title>Request an Invitation</Dialog.Title>
				<Dialog.Description>
					Enter your email and we'll notify an admin to review your request.
				</Dialog.Description>
			</Dialog.Header>

			{#if requestSuccess}
				<!-- Success State -->
				<div class="py-6 text-center">
					<div class="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
						<CheckCircle2 class="h-8 w-8 text-green-500" />
					</div>
					<h3 class="text-lg font-semibold mb-2">Request Submitted!</h3>
					<p class="text-muted-foreground text-sm mb-4">
						We'll review your request and get back to you soon.
					</p>
					<Button onclick={() => { requestModalOpen = false; requestSuccess = false; }}>
						Got it
					</Button>
				</div>
			{:else}
				<!-- Request Form -->
				<form
					method="POST"
					action="?/requestInvite"
					class="space-y-4"
	use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							isSubmitting = false;
							if (result.type === 'success') {
								requestSuccess = true;
							}
							await update();
						};
					}}
				>
					<div class="space-y-2">
						<Label for="request-email">Email address</Label>
						<Input
							type="email"
							id="request-email"
							name="email"
							placeholder="you@example.com"
							value={requestInviteForm?.email || ''}
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="request-message">
							Why do you want to join? <span class="text-muted-foreground font-normal">(optional)</span>
						</Label>
						<Textarea
							id="request-message"
							name="message"
							placeholder="I'm a home bartender looking to organize my bar..."
							rows={3}
							value={requestInviteForm?.message || ''}
						/>
					</div>

					{#if requestInviteForm?.error}
						<div class="text-sm text-destructive bg-destructive/10 rounded-md p-3">
							{requestInviteForm.error}
						</div>
					{/if}

					<Dialog.Footer class="flex-col sm:flex-row gap-2">
						<Button
							type="button"
							variant="outline"
							onclick={() => requestModalOpen = false}
							class="w-full sm:w-auto"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							class="w-full sm:w-auto"
							disabled={isSubmitting}
						>
							{#if isSubmitting}
								<Loader2 class="h-4 w-4 mr-2 animate-spin" />
								Submitting...
							{:else}
								<Send class="h-4 w-4 mr-2" />
								Submit Request
							{/if}
						</Button>
					</Dialog.Footer>
				</form>
			{/if}
		</Dialog.Content>
	</Dialog.Root>

{:else}
	<!-- ==================== AUTHENTICATED DASHBOARD ==================== -->

	{#if dashboardData}
		<!-- Welcome Header -->
		<section class="mb-8 mt-4">
			<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 class="text-3xl md:text-4xl font-bold mb-2">
						Welcome back, {dashboardData.userName}!
					</h1>
					<p class="text-muted-foreground">
						Here's what's happening with your home bar today.
					</p>
				</div>

				<!-- Quick Stats Cards -->
				<div class="flex gap-3">
					<Card.Root class="px-4 py-3">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-full bg-green-500/10">
								<CheckCircle2 class="h-5 w-5 text-green-500" />
							</div>
							<div>
								<p class="text-2xl font-bold">{dashboardData.availableCount}</p>
								<p class="text-xs text-muted-foreground">Ready to Make</p>
							</div>
						</div>
					</Card.Root>
					<Card.Root class="px-4 py-3">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-full bg-primary/10">
								<Package class="h-5 w-5 text-primary" />
							</div>
							<div>
								<p class="text-2xl font-bold">{dashboardData.inventoryCount}</p>
								<p class="text-xs text-muted-foreground">In Inventory</p>
							</div>
						</div>
					</Card.Root>
				</div>
			</div>
		</section>

		<!-- Quick Actions -->
		<section class="mb-8">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
				{#if canModify}
					<a href="/inventory/add" class="block">
						<Card.Root class="p-4 hover:shadow-md transition-shadow hover:border-primary/50 cursor-pointer h-full">
							<div class="flex items-center gap-3">
								<div class="p-2 rounded-lg bg-primary/10">
									<Plus class="h-5 w-5 text-primary" />
								</div>
								<div>
									<p class="font-medium">Add Ingredient</p>
									<p class="text-xs text-muted-foreground">Update inventory</p>
								</div>
							</div>
						</Card.Root>
					</a>
				{/if}

				<a href="/catalog/browse" class="block">
					<Card.Root class="p-4 hover:shadow-md transition-shadow hover:border-primary/50 cursor-pointer h-full">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-lg bg-primary/10">
								<BookOpen class="h-5 w-5 text-primary" />
							</div>
							<div>
								<p class="font-medium">Browse Catalog</p>
								<p class="text-xs text-muted-foreground">{dashboardData.totalRecipes} recipes</p>
							</div>
						</div>
					</Card.Root>
				</a>

				{#if gallery.length > 0}
					<button onclick={surpriseMe} class="block text-left w-full">
						<Card.Root class="p-4 hover:shadow-md transition-shadow hover:border-primary/50 cursor-pointer h-full">
							<div class="flex items-center gap-3">
								<div class="p-2 rounded-lg bg-amber-500/10">
									<Shuffle class="h-5 w-5 text-amber-500" />
								</div>
								<div>
									<p class="font-medium">Surprise Me!</p>
									<p class="text-xs text-muted-foreground">Random cocktail</p>
								</div>
							</div>
						</Card.Root>
					</button>
				{/if}

				<a href="/inventory" class="block">
					<Card.Root class="p-4 hover:shadow-md transition-shadow hover:border-primary/50 cursor-pointer h-full">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-lg bg-primary/10">
								<Package class="h-5 w-5 text-primary" />
							</div>
							<div>
								<p class="font-medium">View Inventory</p>
								<p class="text-xs text-muted-foreground">{dashboardData.inventoryCount} items</p>
							</div>
						</div>
					</Card.Root>
				</a>
			</div>
		</section>

		<!-- Ready to Make Section -->
		<section class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h2 class="text-2xl font-bold flex items-center gap-2">
						<CheckCircle2 class="h-6 w-6 text-green-500" />
						Ready to Make
					</h2>
					<p class="text-sm text-muted-foreground">
						Cocktails you can make right now with your inventory
					</p>
				</div>
				<a href="/catalog/browse?available=true" class="text-sm text-primary hover:underline flex items-center">
					View all
					<ChevronRight class="h-4 w-4" />
				</a>
			</div>

			<!-- Spirit Filter Chips -->
			<div class="flex flex-wrap gap-2 mb-4">
				<Button
					variant={sortBy === 'all' ? 'default' : 'outline'}
					class="rounded-full"
					size="sm"
					onclick={() => setFilterType('all')}
				>
					All ({gallery.length})
				</Button>
				{#each spirits as spirit}
					{@const count = gallery.filter(g => g.data.recipeCategoryId === spirit.recipeCategoryId).length}
					{#if count > 0}
						<Button
							variant={sortBy === spirit.recipeCategoryId ? 'default' : 'outline'}
							class="rounded-full"
							size="sm"
							onclick={() => setFilterType(spirit.recipeCategoryId)}
						>
							{spirit.recipeCategoryDescription} ({count})
						</Button>
					{/if}
				{/each}
			</div>

			{#if gallery.length === 0}
				<!-- Empty State -->
				<Card.Root class="border-dashed">
					<Card.Content class="flex flex-col items-center justify-center py-12 text-center">
						<div class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
							<GlassWater class="h-8 w-8 text-muted-foreground/50" />
						</div>
						<h3 class="text-lg font-semibold mb-2">No Cocktails Available Yet</h3>
						<p class="text-muted-foreground mb-4 max-w-md">
							Add more ingredients to your inventory to unlock cocktail recipes you can make.
						</p>
						{#if canModify}
							<a href="/inventory/add" class={buttonVariants()}>
								<Plus class="h-4 w-4 mr-2" />
								Add Ingredients
							</a>
						{/if}
					</Card.Content>
				</Card.Root>
			{:else}
				<!-- Recipe Grid -->
				<div class="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
					{#each filter.slice(0, 8) as item (item.data.recipeId)}
						<a
							href="/catalog/{item.data.recipeId}"
							class="block group"
							in:fade={{ duration: 200 }}
						>
							<Card.Root class="overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-105">
								<div class="relative aspect-square">
									<img
										src={item.src}
										alt={item.alt}
										class="h-full w-full object-cover"
										loading="lazy"
									/>
									<div class="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
									<Badge variant="secondary" class="absolute top-2 left-2 bg-background/80 backdrop-blur-sm">
										{item.data.recipeCategoryDescription}
									</Badge>
								</div>
								<Card.Content class="p-3">
									<p class="font-bold truncate group-hover:text-primary transition-colors">
										{item.alt}
									</p>
									<p class="text-xs text-muted-foreground line-clamp-1">
										{item.data.recipeDescription || 'A delicious cocktail'}
									</p>
								</Card.Content>
							</Card.Root>
						</a>
					{/each}
				</div>

				{#if filter.length > 8}
					<div class="text-center mt-4">
						<a href="/catalog/browse?available=true" class={buttonVariants({ variant: "outline" })}>
							View All {filter.length} Available Recipes
							<ArrowRight class="ml-2 h-4 w-4" />
						</a>
					</div>
				{/if}
			{/if}
		</section>

		<!-- Almost There Section -->
		{#if dashboardData.almostThereRecipes && dashboardData.almostThereRecipes.length > 0}
			<section class="mb-8">
				<div class="flex items-center justify-between mb-4">
					<div>
						<h2 class="text-2xl font-bold flex items-center gap-2">
							<AlertCircle class="h-6 w-6 text-amber-500" />
							Almost There
						</h2>
						<p class="text-sm text-muted-foreground">
							Just one ingredient away from these cocktails
						</p>
					</div>
				</div>

				<div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
					{#each dashboardData.almostThereRecipes.slice(0, 6) as recipe}
						<Card.Root class="overflow-hidden hover:shadow-md transition-shadow">
							<div class="flex items-center gap-4 p-4">
								<div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-muted">
									{#if recipe.recipeImageUrl}
										<img
											src={recipe.recipeImageUrl}
											alt={recipe.recipeName}
											class="w-full h-full object-cover"
										/>
									{:else}
										<div class="w-full h-full flex items-center justify-center">
											<GlassWater class="h-6 w-6 text-muted-foreground" />
										</div>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<p class="font-bold truncate">{recipe.recipeName}</p>
									<p class="text-xs text-muted-foreground">{recipe.recipeCategoryDescription}</p>
									{#if recipe.missingIngredient}
										<Badge variant="outline" class="mt-1 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
											<ShoppingCart class="h-3 w-3 mr-1" />
											Need: {recipe.missingIngredient}
										</Badge>
									{/if}
								</div>
								<a
									href="/catalog/{recipe.recipeId}"
									class={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
								>
									<ChevronRight class="h-5 w-5" />
								</a>
							</div>
						</Card.Root>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Top Spirit Section -->
		{#if dashboardData.topSpirit && dashboardData.spiritCounts[dashboardData.topSpirit.recipeCategoryId] > 0}
			<section class="mb-8">
				<Card.Root class="overflow-hidden">
					<div class="flex flex-col md:flex-row">
						<div class="relative w-full md:w-48 h-32 md:h-auto shrink-0">
							<img
								src={dashboardData.topSpirit.recipeCategoryDescriptionImageUrl}
								alt={dashboardData.topSpirit.recipeCategoryDescription}
								class="w-full h-full object-cover"
							/>
							<div class="absolute inset-0 bg-gradient-to-r from-transparent to-background md:bg-gradient-to-t md:from-transparent md:to-background"></div>
						</div>
						<Card.Content class="flex-1 flex flex-col justify-center p-6">
							<Badge variant="secondary" class="w-fit mb-2">
								<TrendingUp class="h-3 w-3 mr-1" />
								Your Top Spirit
							</Badge>
							<h3 class="text-xl font-bold mb-1">
								{dashboardData.topSpirit.recipeCategoryDescription}
							</h3>
							<p class="text-muted-foreground text-sm mb-3">
								You can make {dashboardData.spiritCounts[dashboardData.topSpirit.recipeCategoryId]} cocktails with your {dashboardData.topSpirit.recipeCategoryDescription?.toLowerCase() ?? ''} collection.
							</p>
							<a
								href="/catalog/browse/{dashboardData.topSpirit.recipeCategoryId}"
								class={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit")}
							>
								Explore {dashboardData.topSpirit.recipeCategoryDescription} Cocktails
								<ArrowRight class="ml-2 h-4 w-4" />
							</a>
						</Card.Content>
					</div>
				</Card.Root>
			</section>
		{/if}
	{/if}
{/if}

<style>
	.bg-grid-pattern {
		background-image: radial-gradient(circle, currentColor 1px, transparent 1px);
		background-size: 24px 24px;
	}
</style>
