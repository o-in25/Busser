<script lang="ts">
	import type { PageData } from './$types';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import {
		Package,
		BookOpen,
		Sparkles,
		Users,
		Search,
		Bell,
		ChefHat,
		Lightbulb,
		ArrowRight,
		GlassWater,
		FlaskConical,
		Star,
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>About - Busser</title>
</svelte:head>

<!-- Hero Section -->
<div class="text-center mb-10">
	<Badge variant="secondary" class="mb-4">
		<GlassWater class="h-3 w-3 mr-1" />
		Home Bar Management
	</Badge>
	<h1 class="text-3xl md:text-4xl font-bold mb-4">
		Your Personal Bartending Assistant
	</h1>
	<p class="text-lg text-muted-foreground max-w-xl mx-auto">
		Busser helps you organize your home bar, discover cocktails you can make, and master the art of mixology.
	</p>
</div>

<!-- Main Features Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
	<!-- Inventory Management -->
	<Card.Root class="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors">
		<div class="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-primary/10 blur-2xl"></div>
		<Card.Header class="pb-2">
			<div class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
				<Package class="h-6 w-6 text-primary" />
			</div>
			<Card.Title class="text-lg">Inventory Management</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-sm text-muted-foreground mb-3">
				Track your spirits, liqueurs, mixers, and ingredients in one place. Organize by category and never lose track of what you have.
			</p>
			<div class="flex flex-wrap gap-2">
				<Badge variant="outline" class="text-xs">
					<Bell class="h-3 w-3 mr-1" />
					Low Stock Alerts
				</Badge>
				<Badge variant="outline" class="text-xs">
					<Search class="h-3 w-3 mr-1" />
					Quick Search
				</Badge>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Recipe Catalog -->
	<Card.Root class="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors">
		<div class="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl"></div>
		<Card.Header class="pb-2">
			<div class="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3 group-hover:bg-amber-500/20 transition-colors">
				<BookOpen class="h-6 w-6 text-amber-600 dark:text-amber-400" />
			</div>
			<Card.Title class="text-lg">Recipe Catalog</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-sm text-muted-foreground mb-3">
				Browse a curated collection of classic and modern cocktails. Each recipe includes detailed ingredients and step-by-step instructions.
			</p>
			<div class="flex flex-wrap gap-2">
				<Badge variant="outline" class="text-xs">
					<FlaskConical class="h-3 w-3 mr-1" />
					Classic Cocktails
				</Badge>
				<Badge variant="outline" class="text-xs">
					<Star class="h-3 w-3 mr-1" />
					Modern Recipes
				</Badge>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Smart Matching -->
	<Card.Root class="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors">
		<div class="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-green-500/10 blur-2xl"></div>
		<Card.Header class="pb-2">
			<div class="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
				<ChefHat class="h-6 w-6 text-green-600 dark:text-green-400" />
			</div>
			<Card.Title class="text-lg">Smart Matching</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-sm text-muted-foreground mb-3">
				Discover which cocktails you can make right now based on your current inventory. No more guessing or missing ingredients.
			</p>
			<div class="flex flex-wrap gap-2">
				<Badge variant="outline" class="text-xs">
					<Sparkles class="h-3 w-3 mr-1" />
					Instant Results
				</Badge>
				<Badge variant="outline" class="text-xs">
					<GlassWater class="h-3 w-3 mr-1" />
					Make Tonight
				</Badge>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- AI-Powered -->
	<Card.Root class="group relative overflow-hidden border-primary/20 hover:border-primary/40 transition-colors">
		<div class="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-500/10 blur-2xl"></div>
		<Card.Header class="pb-2">
			<div class="w-12 h-12 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3 group-hover:bg-violet-500/20 transition-colors">
				<Sparkles class="h-6 w-6 text-violet-600 dark:text-violet-400" />
			</div>
			<Card.Title class="text-lg">AI-Powered Tools</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-sm text-muted-foreground mb-3">
				Leverage intelligent features to generate recipe suggestions and get personalized recommendations based on your preferences.
			</p>
			<div class="flex flex-wrap gap-2">
				<Badge variant="outline" class="text-xs">
					<Lightbulb class="h-3 w-3 mr-1" />
					Smart Suggestions
				</Badge>
				<Badge variant="outline" class="text-xs">
					<Star class="h-3 w-3 mr-1" />
					Personalized
				</Badge>
			</div>
		</Card.Content>
	</Card.Root>
</div>

<!-- Workspace Feature -->
<Card.Root class="mb-8 bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20">
	<Card.Content class="flex flex-col md:flex-row items-center gap-6 py-6">
		<div class="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
			<Users class="h-8 w-8 text-primary" />
		</div>
		<div class="text-center md:text-left">
			<h3 class="text-lg font-semibold mb-2">Workspace Collaboration</h3>
			<p class="text-sm text-muted-foreground">
				Create shared workspaces to manage your bar with friends, family, or colleagues. Perfect for home bars, small events, or collaborative cocktail exploration. Invite members and control who can view or edit your inventory and recipes.
			</p>
		</div>
	</Card.Content>
</Card.Root>

<!-- Get Started CTA (only for non-authenticated users) -->
{#if !data.user}
	<Card.Root class="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30">
		<Card.Content class="text-center py-8">
			<h2 class="text-xl font-bold mb-2">Ready to Elevate Your Home Bar?</h2>
			<p class="text-muted-foreground mb-6 max-w-md mx-auto">
				Create a free account to start tracking your inventory and discovering new cocktails today.
			</p>
			<div class="flex flex-col sm:flex-row gap-3 justify-center">
				<a href="/signup" class={buttonVariants({ size: "lg" })}>
					Get Started Free
					<ArrowRight class="ml-2 h-4 w-4" />
				</a>
				<a href="/login" class={buttonVariants({ variant: "outline", size: "lg" })}>
					Log In
				</a>
			</div>
		</Card.Content>
	</Card.Root>
{/if}

<!-- Contact -->
<div class="text-center mt-8 pt-6 border-t border-border">
	<p class="text-sm text-muted-foreground">
		Have questions or feedback? Contact us at
		<a href="mailto:support@busserapp.com" class="text-primary hover:underline font-medium">
			support@busserapp.com
		</a>
	</p>
</div>
