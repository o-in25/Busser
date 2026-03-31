<script lang="ts">
	import {
		AlertCircle,
		ArrowRight,
		Bell,
		BookOpen,
		CheckCircle2,
		ChefHat,
		ChevronDown,
		ChevronRight,
		FlaskConical,
		GlassWater,
		Lightbulb,
		Loader2,
		LogIn,
		Mail,
		Package,
		Plus,
		Search,
		Send,
		ShoppingCart,
		Shuffle,
		Sparkles,
		Star,
		TrendingUp,
		Users,
		BarChart3,
		DollarSign,
		X,
		SwatchBook,
		MapPin,
	} from 'lucide-svelte';
	import { fade, slide } from 'svelte/transition';

	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import logo from '$lib/assets/logo.png';
	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import TasteProfileChart from '$lib/components/TasteProfileChart.svelte';
	import CocktailOfTheDay from '$lib/components/CocktailOfTheDay.svelte';
	import CostBreakdown from '$lib/components/CostBreakdown.svelte';
	import FancyButton from '$lib/components/FancyButton.svelte';
	import TopSpirit from '$lib/components/TopSpirit.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { reveal } from '$lib/actions/reveal';
	import { idToSlug } from '$lib/spirits';
	import { cn } from '$lib/utils';

	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	function getGreeting() {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 17) return 'Good afternoon';
		if (hour < 24) return 'Good evening';
		return 'Welcome back';
	}

	// Invitation request modal state
	let requestModalOpen = $state(false);
	let isSubmitting = $state(false);
	let requestSuccess = $state(false);

	// Form error state - cast to handle the union type properly
	let requestInviteForm = $derived(
		form?.requestInvite as { error?: string; email?: string; message?: string } | undefined
	);

	const recipes = $derived(data.recipes);
	const spirits = $derived(data.spirits);
	const dashboardData = $derived(data.dashboardData);
	const landingData = $derived(data.landingData);

	// workspace role determines resource access (viewer can only read)
	const workspaceRole = $derived(dashboardData?.workspaceRole);
	const canModify = $derived(workspaceRole === 'owner' || workspaceRole === 'editor');

	// Gallery setup for authenticated users
	const gallery = $derived(
		recipes?.map(
			({
				recipeImageUrl,
				recipeName,
				recipeCategoryDescription,
				recipeId,
				recipeCategoryId,
				recipeDescription,
				recipeSweetnessRating,
				recipeDrynessRating,
				recipeStrengthRating,
				recipeVersatilityRating,
			}) => ({
				src: recipeImageUrl || '',
				alt: recipeName,
				hasImage: !!recipeImageUrl,
				data: {
					recipeCategoryDescription,
					recipeId,
					recipeCategoryId,
					recipeDescription,
					recipeSweetnessRating,
					recipeDrynessRating,
					recipeStrengthRating,
					recipeVersatilityRating,
				},
			})
		) || []
	);

	// Filter state for gallery
	let sortBy: string | number = $state('all');
	let activeMood: string | null = $state(null);
	let moodExpanded = $state(false);
	let spiritExpanded = $state(false);

	// mood definitions
	const moods = [
		{
			id: 'strong-dry',
			label: 'Strong & Dry',
			test: (d: (typeof gallery)[0]['data']) =>
				d.recipeStrengthRating >= 6 && d.recipeDrynessRating >= 6,
		},
		{
			id: 'sweet-easy',
			label: 'Sweet & Easy',
			test: (d: (typeof gallery)[0]['data']) =>
				d.recipeSweetnessRating >= 6 && d.recipeStrengthRating <= 5,
		},
		{
			id: 'balanced',
			label: 'Balanced',
			test: (d: (typeof gallery)[0]['data']) => {
				const vals = [
					d.recipeSweetnessRating,
					d.recipeDrynessRating,
					d.recipeStrengthRating,
					d.recipeVersatilityRating,
				];
				const mean = vals.reduce((a, b) => a + b, 0) / 4;
				return vals.every((v) => Math.abs(v - mean) <= 2.5);
			},
		},
		{
			id: 'bold-complex',
			label: 'Bold & Complex',
			test: (d: (typeof gallery)[0]['data']) =>
				d.recipeStrengthRating >= 6 && d.recipeVersatilityRating >= 6,
		},
	];

	// compose spirit + mood filters
	let filter = $derived.by(() => {
		let result =
			sortBy === 'all' ? gallery : gallery.filter((item) => item.data.recipeCategoryId === sortBy);
		if (activeMood) {
			const mood = moods.find((m) => m.id === activeMood);
			if (mood) result = result.filter((item) => mood.test(item.data));
		}
		return result;
	});

	// mood counts (computed against spirit-filtered list)
	const moodCounts = $derived.by(() => {
		const spiritFiltered =
			sortBy === 'all' ? gallery : gallery.filter((item) => item.data.recipeCategoryId === sortBy);
		const counts: Record<string, number> = {};
		for (const mood of moods) {
			counts[mood.id] = spiritFiltered.filter((item) => mood.test(item.data)).length;
		}
		return counts;
	});

	const setFilterType = (type: any) => {
		if (type !== sortBy) {
			sortBy = type;
		}
	};

	// Surprise me - pick random available recipe
	function surpriseMe() {
		if (gallery.length === 0) return;
		const randomRecipe = gallery[Math.floor(Math.random() * gallery.length)];
		goto(`/catalog/${randomRecipe.data.recipeId}`);
	}
</script>

<svelte:head>
	<title>Busser - Home Bar Management</title>
	<meta
		name="description"
		content="Manage your home bar — track inventory, discover cocktails you can make, and collaborate with friends. From shelf to shaker."
	/>
</svelte:head>

{#if !$page.data.user}
	<!-- Hero Section -->
	<section class="relative overflow-hidden py-10 md:py-14 rounded-2xl mt-4">
		<!-- Animated background gradient -->
		<div class="absolute inset-0 hero-gradient-bg -z-10 rounded-2xl"></div>
		<div class="absolute inset-0 bg-grid-pattern opacity-5 -z-10"></div>

		<!-- Floating orbs -->
		<div class="hero-orbs-layer">
			<div class="hero-orb hero-orb-purple"></div>
			<div class="hero-orb hero-orb-pink"></div>
			<div class="hero-orb hero-orb-orange"></div>
		</div>

		<div class="max-w-4xl mx-auto text-center px-4">
			<!-- Logo -->
			<img
				src={logo}
				alt="Busser"
				class="h-28 md:h-36 lg:h-44 mx-auto mb-5 hero-enter-glow"
				style="--delay: 0ms"
			/>

			<!-- Headline -->
			<h1
				class="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 leading-tight hero-enter text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 via-primary-500 to-neon-amber-500"
				style="--delay: 200ms"
			>
				From Shelf To Shaker
			</h1>

			<!-- Subheadline -->
			<p
				class="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto hero-enter"
				style="--delay: 400ms"
			>
				Track your bottles. Discover what you can mix.
			</p>

			<!-- CTAs -->
			<div class="flex flex-col sm:flex-row justify-center gap-4 hero-enter" style="--delay: 600ms">
				<FancyButton variant="primary" href="/signup">
					<Mail class="w-5 h-5 mr-2" />
					Sign Up
				</FancyButton>
				<FancyButton href="/login">
					<LogIn class="w-5 h-5 mr-2" />
					Log In
				</FancyButton>
			</div>

			<!-- Featured Recipes -->
			{#if landingData?.featuredRecipes && landingData.featuredRecipes.length > 0}
				<div class="mt-8 mx-auto max-w-3xl hero-enter" style="--delay: 800ms">
					<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
						{#each landingData.featuredRecipes as recipe, i}
							<div
								class="group rounded-xl overflow-hidden bg-background/30 backdrop-blur-sm border border-border/50 shadow-lg shadow-primary/5 hero-enter"
								style="--delay: {800 + (i + 1) * 100}ms"
							>
								<div class="aspect-square relative">
									<SkeletonImage
										src={recipe.recipeImageUrl}
										alt={recipe.recipeName}
										variant="recipe"
										class="h-full w-full group-hover:scale-105 transition-transform duration-300"
									/>
									<div
										class="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"
									></div>
									{#if recipe.recipeCategoryDescription}
										<Badge
											variant="secondary"
											class="absolute top-2 left-2 bg-background/80 backdrop-blur-sm text-xs"
										>
											{recipe.recipeCategoryDescription}
										</Badge>
									{/if}
									<p
										class="absolute bottom-2 left-2 right-2 text-sm font-semibold text-foreground truncate"
									>
										{recipe.recipeName}
									</p>
								</div>
							</div>
						{/each}
					</div>
					<div class="mt-6">
						<FancyButton href="/catalog" class="!py-2 !px-5 !text-sm">
							Browse Catalog
							<ArrowRight class="h-3.5 w-3.5 ml-1.5" />
						</FancyButton>
					</div>
				</div>
			{/if}
		</div>
	</section>

	<!-- Live Catalog Content -->
	<section class="py-8 px-4">
		<div class="max-w-6xl mx-auto">
			<!-- Cocktail of the Day -->
			{#if landingData?.cocktailOfTheDay}
				<div class="mb-8 reveal-on-scroll" use:reveal>
					<CocktailOfTheDay recipe={landingData.cocktailOfTheDay} />
				</div>
			{/if}

			<!-- Browse by Spirit -->
			{#if landingData?.allSpirits && landingData.allSpirits.length > 0}
				<div class="mb-8 reveal-on-scroll" use:reveal={{ delay: 100 }}>
					<div class="flex items-center justify-between mb-4">
						<h2 class="text-2xl font-bold flex items-center gap-2">
							<GlassWater class="h-6 w-6 text-primary" />
							Explore by Spirit
						</h2>
						<a href="/catalog" class="text-sm text-primary hover:underline flex items-center gap-1">
							View All <ArrowRight class="h-3 w-3" />
						</a>
					</div>
					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
						{#each landingData.allSpirits as spirit}
							<a
								href="/catalog/browse/{idToSlug[spirit.recipeCategoryId] ??
									spirit.recipeCategoryId}"
								class="block group"
							>
								<Card.Root class="relative overflow-hidden h-32 hover:shadow-lg transition-all">
									{#if spirit.recipeCategoryDescriptionImageUrl}
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
									{/if}
									<div class="absolute inset-0 p-3 flex flex-col justify-end">
										<h3 class="text-sm font-bold text-foreground">
											{spirit.recipeCategoryDescription}
										</h3>
									</div>
								</Card.Root>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Quick Actions -->
			<div
				class="flex flex-wrap gap-3 justify-center mb-4 reveal-on-scroll"
				use:reveal={{ delay: 200 }}
			>
				<FancyButton href="/catalog/browse" size="md">
					<FlaskConical class="h-4 w-4 mr-2" />
					Browse {landingData?.totalRecipes || ''} Recipes
				</FancyButton>
				<FancyButton
					size="md"
					onclick={() => {
						if (recipes.length > 0) {
							const random = recipes[Math.floor(Math.random() * recipes.length)];
							goto(`/catalog/${random.recipeId}`);
						}
					}}
				>
					<Shuffle class="h-4 w-4 mr-2" />
					Surprise Me
				</FancyButton>
			</div>
		</div>
	</section>

	<!-- Features Section -->
	<section class="py-16 px-4">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-12 reveal-on-scroll" use:reveal>
				<h2 class="text-3xl md:text-4xl font-bold mb-4">Features</h2>
				<p class="text-muted-foreground text-lg max-w-2xl mx-auto">
					Busser finds recipes that match your on-hand ingredients, no guesswork needed.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<!-- Inventory Management -->
				<div class="reveal-on-scroll" use:reveal={{ delay: 0 }}>
					<Card.Root
						class="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors"
					>
						<div class="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl bg-[rgba(248,78,128,0.6)]"></div>
						<Card.Header class="pb-2">
							<div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
								<Package class="h-6 w-6 text-primary" />
							</div>
							<Card.Title class="text-lg">Inventory Management</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-sm text-muted-foreground">
								Track your spirits, liqueurs, mixers, and ingredients in one place. Organize by
								category and never lose track of what you have.
							</p>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Smart Matching -->
				<div class="reveal-on-scroll" use:reveal={{ delay: 200 }}>
					<Card.Root
						class="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors"
					>
						<div class="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-20 blur-3xl bg-[rgba(28,186,138,0.6)]"></div>
						<Card.Header class="pb-2">
							<div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
								<SwatchBook class="h-6 w-6 text-primary" />
							</div>
							<Card.Title class="text-lg">Smart Matching</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-sm text-muted-foreground">
								Discover which cocktails you can make right now based on your current inventory. No
								more guessing or missing ingredients.
							</p>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Spirit Guide -->
				<div class="reveal-on-scroll" use:reveal={{ delay: 100 }}>
					<Card.Root
						class="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors"
					>
						<div class="absolute -top-8 -left-8 w-40 h-40 rounded-full opacity-20 blur-3xl bg-[rgba(232,163,15,0.6)]"></div>
						<Card.Header class="pb-2">
							<div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
								<BookOpen class="h-6 w-6 text-primary" />
							</div>
							<Card.Title class="text-lg">Spirit Guide</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-sm text-muted-foreground">
								Browse a curated and detailed spirit catalog, with cocktail history, how different
								spirits are made, and bartending tips.
							</p>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- AI-Powered -->
				<div class="reveal-on-scroll" use:reveal={{ delay: 300 }}>
					<Card.Root
						class="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors"
					>
						<div class="absolute -bottom-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl bg-[rgba(165,125,213,0.6)]"></div>
						<Card.Header class="pb-2">
							<div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
								<Sparkles class="h-6 w-6 text-primary" />
							</div>
							<Card.Title class="text-lg">AI-Powered Tools</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-sm text-muted-foreground">
								Leverage intelligent features to generate recipe suggestions and get personalized
								recommendations based on your preferences.
							</p>
						</Card.Content>
					</Card.Root>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Store Finder -->
				<div class="reveal-on-scroll" use:reveal={{ delay: 400 }}>
					<Card.Root
						class="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors h-full"
					>
						<div class="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-3xl bg-[rgba(34,211,238,0.6)]"></div>
						<Card.Header class="pb-2">
							<div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
								<MapPin class="h-6 w-6 text-primary" />
							</div>
							<Card.Title class="text-lg">Store Finder</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-sm text-muted-foreground">
								Find nearby liquor stores to restock your bar or compare product prices.
								Powered by Google Places, so you always know where to get what you need.
							</p>
						</Card.Content>
					</Card.Root>
				</div>

				<!-- Workspace Collaboration -->
				<div class="reveal-on-scroll" use:reveal={{ delay: 500 }}>
					<Card.Root
						class="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors h-full"
					>
						<div class="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-20 blur-3xl bg-[rgba(248,78,128,0.4)]"></div>
						<Card.Header class="pb-2">
							<div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
								<Users class="h-6 w-6 text-primary" />
							</div>
							<Card.Title class="text-lg">Workspace Collaboration</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-sm text-muted-foreground">
								Create shared workspaces to manage your bar with friends, family, or colleagues.
								Perfect for home bars, small events, or collaborative cocktail exploration.
							</p>
						</Card.Content>
					</Card.Root>
				</div>
			</div>
		</div>
	</section>

	<!-- How It Works Section -->
	<section class="py-16 px-4">
		<div class="max-w-4xl mx-auto">
			<div class="text-center mb-12 reveal-on-scroll" use:reveal>
				<h2 class="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
				<p class="text-muted-foreground text-lg">Three steps to your next cocktail</p>
			</div>

			<div class="relative">
				<!-- connecting line (desktop only) -->
				<div
					class="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary-500 via-neon-amber-500 to-neon-green-500 opacity-30"
				></div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
					<!-- step 1 -->
					<div
						class="reveal-on-scroll flex flex-col items-center text-center relative z-10"
						use:reveal={{ delay: 0 }}
					>
						<div class="relative mb-4">
							<div class="rounded-full bg-background">
								<div
									class="w-24 h-24 rounded-full bg-primary-500/10 flex items-center justify-center"
								>
									<Package class="h-10 w-10 text-primary-500" />
								</div>
							</div>
							<span
								class="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center"
							>
								1
							</span>
						</div>
						<h3 class="text-lg font-semibold mb-2">Add Your Bottles</h3>
						<p class="text-sm text-muted-foreground">
							Log the spirits, liqueurs, and mixers you already own.
						</p>
					</div>

					<!-- step 2 -->
					<div
						class="reveal-on-scroll flex flex-col items-center text-center relative z-10"
						use:reveal={{ delay: 150 }}
					>
						<div class="relative mb-4">
							<div class="rounded-full bg-background">
								<div
									class="w-24 h-24 rounded-full bg-neon-amber-500/10 flex items-center justify-center"
								>
									<SwatchBook class="h-10 w-10 text-neon-amber-500" />
								</div>
							</div>
							<span
								class="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-neon-amber-500 text-white text-xs font-bold flex items-center justify-center"
							>
								2
							</span>
						</div>
						<h3 class="text-lg font-semibold mb-2">Get Matched Recipes</h3>
						<p class="text-sm text-muted-foreground">
							Busser finds every cocktail you can make right now.
						</p>
					</div>

					<!-- step 3 -->
					<div
						class="reveal-on-scroll flex flex-col items-center text-center relative z-10"
						use:reveal={{ delay: 300 }}
					>
						<div class="relative mb-4">
							<div class="rounded-full bg-background">
								<div
									class="w-24 h-24 rounded-full bg-neon-green-500/10 flex items-center justify-center"
								>
									<GlassWater class="h-10 w-10 text-neon-green-500" />
								</div>
							</div>
							<span
								class="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-neon-green-500 text-white text-xs font-bold flex items-center justify-center"
							>
								3
							</span>
						</div>
						<h3 class="text-lg font-semibold mb-2">Start Mixing</h3>
						<p class="text-sm text-muted-foreground">
							Follow step-by-step instructions and enjoy your drink.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Final CTA Section -->
	<section class="py-16 px-4 reveal-on-scroll" use:reveal>
		<div class="max-w-3xl mx-auto text-center">
			<div
				class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/5 border border-primary/20 p-8 md:p-12"
			>
				<div class="absolute inset-0 bg-grid-pattern opacity-5"></div>
				<div class="relative">
					<h2 class="text-3xl md:text-4xl font-bold mb-4">Get Started</h2>
					<p class="text-muted-foreground text-lg mb-4">
						Create an account to start tracking your bar.
					</p>
					{#if landingData?.inviteOnly}
						<p class="text-muted-foreground/60 text-sm mb-8">
							Busser is currently invitation-only while we're in early development.
							<button
								type="button"
								onclick={() => (requestModalOpen = true)}
								class="text-primary hover:underline"
							>
								Request an invite.
							</button>
						</p>
					{/if}
					<FancyButton variant="primary" href="/signup">
						Sign Up
						<ArrowRight class="ml-2 h-5 w-5" />
					</FancyButton>
				</div>
			</div>
		</div>
	</section>

	<!-- Request Invite Modal -->
	{#if landingData?.inviteOnly}
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
						<div
							class="w-16 h-16 rounded-full bg-neon-green-500/10 flex items-center justify-center mx-auto mb-4"
						>
							<CheckCircle2 class="h-8 w-8 text-neon-green-500" />
						</div>
						<h3 class="text-lg font-semibold mb-2">Request Submitted!</h3>
						<p class="text-muted-foreground text-sm mb-4">
							We'll review your request and get back to you soon.
						</p>
						<Button
							onclick={() => {
								requestModalOpen = false;
								requestSuccess = false;
							}}
						>
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
								Why do you want to join? <span class="text-muted-foreground font-normal"
									>(optional)</span
								>
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
								onclick={() => (requestModalOpen = false)}
								class="w-full sm:w-auto"
							>
								Cancel
							</Button>
							<Button type="submit" class="w-full sm:w-auto" disabled={isSubmitting}>
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
	{/if}
{:else}
	<!-- ==================== AUTHENTICATED DASHBOARD ==================== -->

	{#if dashboardData}
		<!-- Welcome Header -->
		<section class="mb-8 mt-4">
			<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h1 class="text-3xl md:text-4xl font-bold mb-2">
						{getGreeting()}
					</h1>
					<p class="text-muted-foreground">Here's what's happening with your home bar.</p>
				</div>

				<!-- Quick Stats Cards -->
				<div class="grid grid-cols-2 gap-3 w-full md:w-auto">
					<Card.Root class="px-4 py-3 md:min-w-[180px]">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-full bg-neon-green-500/10">
								<CheckCircle2 class="h-5 w-5 text-neon-green-500" />
							</div>
							<div>
								<p class="text-2xl font-bold">{dashboardData.availableCount}</p>
								<p class="text-xs text-muted-foreground">Recipes Ready</p>
							</div>
						</div>
					</Card.Root>
					<Card.Root class="px-4 py-3 md:min-w-[180px]">
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-full bg-primary/10">
								<Package class="h-5 w-5 text-primary" />
							</div>
							<div>
								<p class="text-2xl font-bold">{dashboardData.inventoryCount}</p>
								<p class="text-xs text-muted-foreground">Bottles in Stock</p>
							</div>
						</div>
					</Card.Root>
				</div>
			</div>
		</section>

		<!-- Quick Actions -->
		<section class="mb-8">
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
				<a href="/catalog/browse" class="block">
					<Card.Root
						class="p-4 hover:shadow-md transition-shadow hover:border-primary/50 cursor-pointer h-full dark:hover:shadow-glow-pink"
					>
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

				<a href="/inventory?page=1&stockFilter=out-of-stock" class="block">
					<Card.Root
						class="p-4 hover:shadow-md transition-shadow hover:border-primary/50 cursor-pointer h-full dark:hover:shadow-glow-pink"
					>
						<div class="flex items-center gap-3">
							<div class="p-2 rounded-lg bg-primary/10">
								<ShoppingCart class="h-5 w-5 text-primary" />
							</div>
							<div>
								<p class="font-medium">Shopping List</p>
								<p class="text-xs text-muted-foreground">What you need</p>
							</div>
						</div>
					</Card.Root>
				</a>

				{#if canModify}
					<a href="/inventory/add" class="block">
						<Card.Root
							class="p-4 hover:shadow-md transition-shadow hover:border-neon-green-500/50 cursor-pointer h-full dark:hover:shadow-glow-green"
						>
							<div class="flex items-center gap-3">
								<div class="p-2 rounded-lg bg-neon-green-500/10">
									<Plus class="h-5 w-5 text-neon-green-500" />
								</div>
								<div>
									<p class="font-medium">Add Ingredient</p>
									<p class="text-xs text-muted-foreground">Update inventory</p>
								</div>
							</div>
						</Card.Root>
					</a>
				{/if}

				{#if gallery.length > 0}
					<button onclick={surpriseMe} class="block text-left w-full">
						<Card.Root
							class="p-4 hover:shadow-md transition-shadow hover:border-neon-amber-500/50 cursor-pointer h-full dark:hover:shadow-glow-amber"
						>
							<div class="flex items-center gap-3">
								<div class="p-2 rounded-lg bg-neon-amber-500/10">
									<Shuffle class="h-5 w-5 text-neon-amber-500" />
								</div>
								<div>
									<p class="font-medium">Surprise Me!</p>
									<p class="text-xs text-muted-foreground">Random cocktail</p>
								</div>
							</div>
						</Card.Root>
					</button>
				{/if}
			</div>
		</section>

		<!-- Ready to Make Section -->
		<section class="mb-8">
			<div class="flex items-center justify-between mb-4">
				<div>
					<h2 class="text-2xl font-bold flex items-center gap-2">
						<CheckCircle2 class="h-6 w-6 text-neon-green-500" />
						Ready to Make
					</h2>
					<p class="text-sm text-muted-foreground">
						Cocktails you can make right now with your inventory
					</p>
				</div>
				<a
					href="/catalog/browse?available=true"
					class="text-sm text-primary hover:underline hidden md:flex items-center"
				>
					View all
					<ChevronRight class="h-4 w-4" />
				</a>
			</div>

			<!-- Mood Filter Chips -->
			{#if gallery.length > 0}
				<!-- mobile: stacked card deck that fans out -->
				<div class="sm:hidden mb-2 flex items-center overflow-x-auto scrollbar-none">
					<!-- label badge with box-shadow stack effect -->
					<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
					<span
						class="inline-flex items-center rounded-full h-7 text-xs px-3 bg-background/60 backdrop-blur-sm border border-border/50 shrink-0 whitespace-nowrap cursor-pointer transition-all duration-300 ease-out"
						style={!moodExpanded
							? 'box-shadow: 7px 0 0 -1px hsl(var(--background)), 7px 0 0 0px hsl(var(--border)), 14px 0 0 -1px hsl(var(--background)), 14px 0 0 0px hsl(var(--border)); margin-right: 14px;'
							: 'margin-right: 0;'}
						onclick={() => (moodExpanded = !moodExpanded)}
					>
						Mood
						{#if activeMood && !moodExpanded}
							<span class="ml-1 text-primary text-[10px]"
								>{moods.find((m) => m.id === activeMood)?.label}</span
							>
						{/if}
					</span>
					<!-- real filter badges -->
					{#each moods as mood}
						{#if moodCounts[mood.id] > 0}
							<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
							<span
								class="inline-flex items-center rounded-full h-7 text-xs border border-dashed shrink-0 cursor-pointer shadow-sm whitespace-nowrap
									transition-all duration-300 ease-out
									{activeMood === mood.id
									? 'bg-primary text-primary-foreground border-primary'
									: 'bg-background/60 backdrop-blur-sm border-border/50'}
									{moodExpanded ? 'max-w-48 px-3 ml-1.5 opacity-100' : 'max-w-0 px-0 ml-0 opacity-0 overflow-hidden'}"
								onclick={() => {
									activeMood = activeMood === mood.id ? null : mood.id;
									moodExpanded = false;
								}}
							>
								{mood.label}
								<span class="text-[10px] opacity-60 ml-1">{moodCounts[mood.id]}</span>
							</span>
						{/if}
					{/each}
					<!-- close button -->
					<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
					<span
						class="inline-flex items-center justify-center rounded-full h-7 border border-border/50 shrink-0 cursor-pointer bg-background/60 backdrop-blur-sm text-muted-foreground hover:text-foreground
							transition-all duration-300 ease-out
							{moodExpanded ? 'w-7 ml-1.5 opacity-100' : 'w-0 ml-0 opacity-0 overflow-hidden'}"
						onclick={() => (moodExpanded = false)}
					>
						<X class="h-3 w-3" />
					</span>
				</div>

				<!-- desktop: horizontal scroll -->
				<div class="hidden sm:flex items-center gap-2 mb-2">
					<span class="text-[10px] uppercase tracking-wider text-muted-foreground/60 shrink-0"
						>Mood</span
					>
					<div class="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mb-1">
						{#each moods as mood}
							{#if moodCounts[mood.id] > 0}
								<Button
									variant={activeMood === mood.id ? 'default' : 'outline'}
									class="rounded-full border-dashed shrink-0 h-7 text-xs px-3"
									size="sm"
									onclick={() => (activeMood = activeMood === mood.id ? null : mood.id)}
								>
									{mood.label}
									<span class="text-[10px] opacity-60 ml-1">{moodCounts[mood.id]}</span>
								</Button>
							{/if}
						{/each}
						{#if activeMood}
							<Button
								variant="ghost"
								size="sm"
								class="rounded-full text-muted-foreground shrink-0 h-7 text-xs px-2"
								onclick={() => (activeMood = null)}
							>
								<X class="h-3 w-3" />
							</Button>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Spirit Filter Chips -->
			<!-- mobile: stacked card deck that fans out -->
			<div class="sm:hidden mb-4 flex items-center overflow-x-auto scrollbar-none">
				<!-- label badge with box-shadow stack effect -->
				<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
				<span
					class="inline-flex items-center rounded-full h-7 text-xs px-3 bg-background/60 backdrop-blur-sm border border-border/50 shrink-0 whitespace-nowrap cursor-pointer transition-all duration-300 ease-out"
					style={!spiritExpanded
						? 'box-shadow: 7px 0 0 -1px hsl(var(--background)), 7px 0 0 0px hsl(var(--border)), 14px 0 0 -1px hsl(var(--background)), 14px 0 0 0px hsl(var(--border)); margin-right: 14px;'
						: 'margin-right: 0;'}
					onclick={() => (spiritExpanded = !spiritExpanded)}
				>
					Spirit
					{#if sortBy !== 'all' && !spiritExpanded}
						<span class="ml-1 text-primary text-[10px]"
							>{spirits.find((s) => s.recipeCategoryId === sortBy)?.recipeCategoryDescription}</span
						>
					{/if}
				</span>
				<!-- "All" badge -->
				<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
				<span
					class="inline-flex items-center rounded-full h-7 text-xs border shrink-0 cursor-pointer shadow-sm whitespace-nowrap
						transition-all duration-300 ease-out
						{sortBy === 'all'
						? 'bg-primary text-primary-foreground border-primary'
						: 'bg-background/60 backdrop-blur-sm border-border/50'}
						{spiritExpanded
						? 'max-w-48 px-3 ml-1.5 opacity-100'
						: 'max-w-0 px-0 ml-0 opacity-0 overflow-hidden'}"
					onclick={() => {
						setFilterType('all');
						spiritExpanded = false;
					}}
				>
					All
					<span class="text-[10px] opacity-60 ml-1">{gallery.length}</span>
				</span>
				<!-- real spirit badges -->
				{#each spirits as spirit}
					{@const count = gallery.filter(
						(g) => g.data.recipeCategoryId === spirit.recipeCategoryId
					).length}
					{#if count > 0}
						<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
						<span
							class="inline-flex items-center rounded-full h-7 text-xs border shrink-0 cursor-pointer shadow-sm whitespace-nowrap
								transition-all duration-300 ease-out
								{sortBy === spirit.recipeCategoryId
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-background/60 backdrop-blur-sm border-border/50'}
								{spiritExpanded
								? 'max-w-48 px-3 ml-1.5 opacity-100'
								: 'max-w-0 px-0 ml-0 opacity-0 overflow-hidden'}"
							onclick={() => {
								setFilterType(spirit.recipeCategoryId);
								spiritExpanded = false;
							}}
						>
							{spirit.recipeCategoryDescription}
							<span class="text-[10px] opacity-60 ml-1">{count}</span>
						</span>
					{/if}
				{/each}
				<!-- close button -->
				<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
				<span
					class="inline-flex items-center justify-center rounded-full h-7 border border-border/50 shrink-0 cursor-pointer bg-background/60 backdrop-blur-sm text-muted-foreground hover:text-foreground
						transition-all duration-300 ease-out
						{spiritExpanded ? 'w-7 ml-1.5 opacity-100' : 'w-0 ml-0 opacity-0 overflow-hidden'}"
					onclick={() => (spiritExpanded = false)}
				>
					<X class="h-3 w-3" />
				</span>
			</div>

			<!-- desktop: horizontal scroll -->
			<div class="hidden sm:flex items-center gap-2 mb-4">
				<span class="text-[10px] uppercase tracking-wider text-muted-foreground/60 shrink-0"
					>Spirit</span
				>
				<div class="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 -mb-1">
					<Button
						variant={sortBy === 'all' ? 'default' : 'outline'}
						class="rounded-full shrink-0 h-7 text-xs px-3"
						size="sm"
						onclick={() => setFilterType('all')}
					>
						All
						<span class="text-[10px] opacity-60 ml-1">{gallery.length}</span>
					</Button>
					{#each spirits as spirit}
						{@const count = gallery.filter(
							(g) => g.data.recipeCategoryId === spirit.recipeCategoryId
						).length}
						{#if count > 0}
							<Button
								variant={sortBy === spirit.recipeCategoryId ? 'default' : 'outline'}
								class="rounded-full shrink-0 h-7 text-xs px-3"
								size="sm"
								onclick={() => setFilterType(spirit.recipeCategoryId)}
							>
								{spirit.recipeCategoryDescription}
								<span class="text-[10px] opacity-60 ml-1">{count}</span>
							</Button>
						{/if}
					{/each}
				</div>
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
						<a href="/catalog/{item.data.recipeId}" class="block group" in:fade={{ duration: 200 }}>
							<Card.Root
								class="overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:scale-105 dark:hover:shadow-glow-purple"
							>
								<div class="relative aspect-square">
									<SkeletonImage
										src={item.hasImage ? item.src : null}
										alt={item.alt}
										variant="recipe"
										class="h-full w-full"
									/>
									<div
										class="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
									></div>
									<Badge
										variant="secondary"
										class="absolute top-2 left-2 bg-background/80 backdrop-blur-sm"
									>
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
						<a href="/catalog/browse?available=true" class={buttonVariants({ variant: 'outline' })}>
							View All {filter.length} Available Recipes
							<ArrowRight class="ml-2 h-4 w-4" />
						</a>
					</div>
				{/if}
			{/if}
		</section>

		<!-- Cocktail of the Day + Top Spirit Row -->
		{#if dashboardData.cocktailOfTheDay || (dashboardData.topSpirit && dashboardData.spiritCounts[dashboardData.topSpirit.recipeCategoryId] > 0)}
			<section class="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
				{#if dashboardData.cocktailOfTheDay}
					<CocktailOfTheDay recipe={dashboardData.cocktailOfTheDay} />
				{/if}

				{#if dashboardData.topSpirit && dashboardData.spiritCounts[dashboardData.topSpirit.recipeCategoryId] > 0}
					<Card.Root>
						<Card.Header class="pb-3">
							<div class="flex items-center gap-2">
								<div class="p-2 rounded-lg bg-neon-cyan-500/10">
									<TrendingUp class="h-5 w-5 text-neon-cyan-500" />
								</div>
								<div>
									<Card.Title class="text-lg">Your Top Spirit</Card.Title>
									<p class="text-xs text-muted-foreground">
										{dashboardData.topSpirit.recipeCategoryDescription} leads your collection
									</p>
								</div>
							</div>
						</Card.Header>
						<Card.Content>
							<TopSpirit
								topSpirit={dashboardData.topSpirit}
								spiritCounts={dashboardData.spiritCounts}
								availableCount={dashboardData.availableCount}
								allSpirits={dashboardData.allSpirits}
							/>
						</Card.Content>
					</Card.Root>
				{/if}
			</section>
		{/if}

		<!-- Almost There Section -->
		{#if dashboardData.almostThereRecipes && dashboardData.almostThereRecipes.length > 0}
			<section class="mb-8">
				<div class="flex items-center justify-between mb-4">
					<div>
						<h2 class="text-2xl font-bold flex items-center gap-2">
							<AlertCircle class="h-6 w-6 text-neon-amber-500" />
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
								<SkeletonImage
									src={recipe.recipeImageUrl}
									alt={recipe.recipeName}
									variant="recipe"
									class="w-16 h-16 rounded-lg shrink-0"
								/>
								<div class="flex-1 min-w-0">
									<p class="font-bold truncate">{recipe.recipeName}</p>
									<p class="text-xs text-muted-foreground">{recipe.recipeCategoryDescription}</p>
									{#if recipe.missingIngredient}
										<Badge
											variant="outline"
											class="mt-1 text-neon-amber-600 border-neon-amber-300 bg-neon-amber-50 dark:bg-neon-amber-950/30"
										>
											<ShoppingCart class="h-3 w-3 mr-1" />
											Need: {recipe.missingIngredient}
										</Badge>
									{/if}
								</div>
								<a
									href="/catalog/{recipe.recipeId}"
									class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
								>
									<ChevronRight class="h-5 w-5" />
								</a>
							</div>
						</Card.Root>
					{/each}
				</div>
			</section>
		{/if}

		<!-- Dashboard Widgets -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
			<!-- Highest Impact Purchases -->
			{#if dashboardData.highImpactIngredients && dashboardData.highImpactIngredients.length > 0}
				<Card.Root>
					<Card.Header class="pb-3">
						<div class="flex items-center gap-2">
							<div class="p-2 rounded-lg bg-neon-amber-500/10">
								<ShoppingCart class="h-5 w-5 text-neon-amber-500" />
							</div>
							<div>
								<Card.Title class="text-lg">Highest Impact Purchases</Card.Title>
								<p class="text-xs text-muted-foreground">Buy these to unlock the most cocktails</p>
							</div>
						</div>
					</Card.Header>
					<Card.Content class="space-y-3">
						{#each dashboardData.highImpactIngredients as ingredient, i}
							<div class="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
								<div class="flex items-center gap-3 min-w-0">
									<span class="text-lg font-bold text-muted-foreground/60 w-5 text-center shrink-0">
										{i + 1}
									</span>
									<p class="font-medium truncate">{ingredient.ingredientName}</p>
								</div>
								<Badge variant="secondary" class="shrink-0">
									<Sparkles class="h-3 w-3 mr-1" />
									unlocks {ingredient.unlockableRecipes}
								</Badge>
							</div>
						{/each}
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Taste Profile -->
			{#if dashboardData.tasteProfile}
				<Card.Root>
					<Card.Header class="pb-3">
						<div class="flex items-center gap-2">
							<div class="p-2 rounded-lg bg-primary/10">
								<BarChart3 class="h-5 w-5 text-primary" />
							</div>
							<div>
								<Card.Title class="text-lg">Taste Profile</Card.Title>
								<p class="text-xs text-muted-foreground">
									Average flavor profile across {dashboardData.availableCount} recipes
								</p>
							</div>
						</div>
					</Card.Header>
					<Card.Content>
						<TasteProfileChart {...dashboardData.tasteProfile} />
					</Card.Content>
				</Card.Root>
			{/if}

			<!-- Cost Breakdown -->
			{#if dashboardData.costBreakdown}
				<Card.Root>
					<Card.Header class="pb-3">
						<div class="flex items-center gap-2">
							<div class="p-2 rounded-lg bg-neon-green-500/10">
								<DollarSign class="h-5 w-5 text-neon-green-500" />
							</div>
							<div>
								<Card.Title class="text-lg">Cost Breakdown</Card.Title>
								<p class="text-xs text-muted-foreground">
									Estimated costs across your available recipes
								</p>
							</div>
						</div>
					</Card.Header>
					<Card.Content>
						<CostBreakdown costBreakdown={dashboardData.costBreakdown} />
					</Card.Content>
				</Card.Root>
			{/if}
		</div>
	{/if}
{/if}

<style>
	.bg-grid-pattern {
		background-image: radial-gradient(circle, currentColor 1px, transparent 1px);
		background-size: 24px 24px;
	}

	@keyframes glow {
		0%,
		100% {
			filter: drop-shadow(0 0 8px rgba(165, 125, 213, 0.3));
		}
		50% {
			filter: drop-shadow(0 0 24px rgba(248, 78, 128, 0.5));
		}
	}

	/* logo: entrance + glow combined so neither overrides the other */
	.hero-enter-glow {
		opacity: 0;
		animation:
			hero-fade-up 0.7s ease-out forwards,
			glow 3s ease-in-out infinite;
		animation-delay: var(--delay, 0ms), var(--delay, 0ms);
	}

	/* staggered entrance animation */
	.hero-enter {
		opacity: 0;
		animation: hero-fade-up 0.7s ease-out forwards;
		animation-delay: var(--delay, 0ms);
	}

	@keyframes hero-fade-up {
		from {
			opacity: 0;
			translate: 0 20px;
		}
		to {
			opacity: 1;
			translate: 0 0;
		}
	}

	/* animated background gradient */
	.hero-gradient-bg {
		background: linear-gradient(
			135deg,
			rgba(165, 125, 213, 0.1),
			rgba(248, 78, 128, 0.05),
			rgba(232, 163, 15, 0.1),
			rgba(165, 125, 213, 0.08)
		);
		background-size: 200% 200%;
		animation: gradient-shift 8s ease infinite;
	}

	@keyframes gradient-shift {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	/* floating orbs */
	.hero-orbs-layer {
		position: absolute;
		inset: 0;
		z-index: -5;
		pointer-events: none;
	}

	.hero-orb {
		position: absolute;
		width: 16rem;
		height: 16rem;
		border-radius: 9999px;
		opacity: 0.2;
		filter: blur(48px);
	}

	.hero-orb-purple {
		top: 5%;
		left: 10%;
		background: rgba(165, 125, 213, 0.6);
		animation: float-1 12s ease-in-out infinite;
	}

	.hero-orb-pink {
		top: 30%;
		right: 10%;
		background: rgba(248, 78, 128, 0.6);
		animation: float-2 16s ease-in-out infinite;
	}

	.hero-orb-orange {
		bottom: 10%;
		left: 20%;
		background: rgba(232, 163, 15, 0.6);
		animation: float-3 14s ease-in-out infinite;
	}

	@keyframes float-1 {
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

	@keyframes float-2 {
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

	@keyframes float-3 {
		0%,
		100% {
			transform: translate(0, 0);
		}
		33% {
			transform: translate(20px, 15px);
		}
		66% {
			transform: translate(-30px, -10px);
		}
	}

	/* app preview mockup */
	.app-preview-frame {
		transform: perspective(1200px) rotateX(4deg) rotateY(-2deg);
		transition: transform 0.4s ease-out;
	}

	.app-preview-frame:hover {
		transform: perspective(1200px) rotateX(1deg) rotateY(-0.5deg);
	}

	/* reduced motion: disable all hero animations */
	@media (prefers-reduced-motion: reduce) {
		.hero-enter,
		.hero-enter-glow {
			animation: none;
			opacity: 1;
		}

		.hero-gradient-bg {
			animation: none;
		}

		.hero-orb {
			animation-play-state: paused;
		}

		.app-preview-frame {
			transform: none;
		}

		.app-preview-frame:hover {
			transform: none;
		}
	}
</style>
