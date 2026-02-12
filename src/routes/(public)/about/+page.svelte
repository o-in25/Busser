<script lang="ts">
	import {
		ArrowRight,
		Bell,
		BookOpen,
		CircleCheck,
		CircleDot,
		FlaskConical,
		FolderPlus,
		GlassWater,
		ListPlus,
		Package,
		Search,
		Sparkles,
		UserPlus,
	} from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { buttonVariants } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>About - Busser</title>
</svelte:head>

<!-- Hero Section -->
<div class="mb-10">
	<h1 class="text-3xl md:text-4xl font-bold mb-4">About Busser</h1>
	<p class="text-lg text-muted-foreground max-w-2xl">
		Busser is a home bar management app that helps you track your inventory, organize cocktail
		recipes, and discover what drinks you can make with what you have on hand.
	</p>
	<div class="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-muted-foreground">
		<span class="flex items-center gap-1.5">
			<Package class="h-4 w-4" />
			Inventory tracking
		</span>
		<span class="flex items-center gap-1.5">
			<GlassWater class="h-4 w-4" />
			Recipe catalog
		</span>
		<span class="flex items-center gap-1.5">
			<Sparkles class="h-4 w-4" />
			Smart matching
		</span>
	</div>
</div>

<!-- How It Works Tutorial -->
<div class="mb-8">
	<div class="text-center mb-6">
		<Badge variant="outline" class="mb-3">
			<BookOpen class="h-3 w-3 mr-1" />
			Getting Started
		</Badge>
		<h2 class="text-2xl font-bold">How Busser Works</h2>
		<p class="text-muted-foreground mt-2 max-w-lg mx-auto">
			Get up and running in minutes with this quick walkthrough of Busser's core features.
		</p>
	</div>

	<div class="space-y-6">
		<!-- Step 1: Workspaces -->
		<Card.Root class="relative overflow-hidden">
			<div class="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
			<Card.Content class="py-5 pl-6">
				<div class="flex items-start gap-4">
					<div
						class="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold"
					>
						1
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold flex items-center gap-2 mb-2">
							<FolderPlus class="h-5 w-5 text-primary" />
							Create a Workspace
						</h3>
						<p class="text-sm text-muted-foreground mb-3">
							A workspace is your personal or shared bar environment. Think of it as a container for
							all your bottles, ingredients, and cocktail recipes. You might have one workspace for
							your home bar, another for a friend's place you help manage, or one for a special
							event.
						</p>
						<div class="bg-muted/50 rounded-lg p-3 text-sm">
							<p class="font-medium mb-2 flex items-center gap-2">
								<UserPlus class="h-4 w-4" />
								Collaboration
							</p>
							<p class="text-muted-foreground">
								Invite others to your workspace with different permission levels. Viewers can browse
								your inventory and recipes, while editors can add and modify items. Perfect for
								couples managing a home bar together or friends planning a cocktail party.
							</p>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Step 2: Inventory -->
		<Card.Root class="relative overflow-hidden">
			<div class="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
			<Card.Content class="py-5 pl-6">
				<div class="flex items-start gap-4">
					<div
						class="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold"
					>
						2
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold flex items-center gap-2 mb-2">
							<Package class="h-5 w-5 text-amber-500" />
							Stock Your Inventory
						</h3>
						<p class="text-sm text-muted-foreground mb-3">
							Add the bottles and ingredients you have on hand. Busser organizes everything into
							categories like spirits (vodka, gin, whiskey), liqueurs, mixers, bitters, and fresh
							ingredients. Each item tracks important details like proof, quantity, and price.
						</p>
						<div class="grid sm:grid-cols-2 gap-3">
							<div class="bg-muted/50 rounded-lg p-3 text-sm">
								<p class="font-medium mb-1 flex items-center gap-2">
									<CircleDot class="h-4 w-4" />
									Categories
								</p>
								<p class="text-muted-foreground">
									Create custom categories to organize your inventory your way - by spirit type,
									shelf location, or however makes sense for your bar.
								</p>
							</div>
							<div class="bg-muted/50 rounded-lg p-3 text-sm">
								<p class="font-medium mb-1 flex items-center gap-2">
									<Bell class="h-4 w-4" />
									Stock Tracking
								</p>
								<p class="text-muted-foreground">
									Mark items as in-stock or out-of-stock. Busser uses this to show you which
									cocktails you can make right now.
								</p>
							</div>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Step 3: Catalog -->
		<Card.Root class="relative overflow-hidden">
			<div class="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
			<Card.Content class="py-5 pl-6">
				<div class="flex items-start gap-4">
					<div
						class="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center shrink-0 font-bold"
					>
						3
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold flex items-center gap-2 mb-2">
							<ListPlus class="h-5 w-5 text-green-500" />
							Build Your Cocktail Catalog
						</h3>
						<p class="text-sm text-muted-foreground mb-3">
							Add cocktail recipes to your catalog with detailed ingredients and preparation
							methods. Each recipe links to items in your inventory, so Busser knows exactly what
							you need to make each drink.
						</p>
						<div class="bg-muted/50 rounded-lg p-3 text-sm mb-3">
							<p class="font-medium mb-2 flex items-center gap-2">
								<FlaskConical class="h-4 w-4" />
								Recipe Details
							</p>
							<ul class="text-muted-foreground space-y-1">
								<li class="flex items-start gap-2">
									<CircleCheck class="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
									<span
										><strong>Ingredients</strong> - Specify exact quantities in oz, ml, dashes, or other
										units</span
									>
								</li>
								<li class="flex items-start gap-2">
									<CircleCheck class="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
									<span
										><strong>Technique</strong> - Stirred, shaken, built, or blended - affects dilution
										calculations</span
									>
								</li>
								<li class="flex items-start gap-2">
									<CircleCheck class="h-4 w-4 mt-0.5 text-green-500 shrink-0" />
									<span
										><strong>Flexible Matching</strong> - Allow substitutions like "any bourbon" instead
										of a specific brand</span
									>
								</li>
							</ul>
						</div>
						<div class="bg-muted/50 rounded-lg p-3 text-sm">
							<p class="font-medium mb-1 flex items-center gap-2">
								<Sparkles class="h-4 w-4" />
								Smart Features
							</p>
							<p class="text-muted-foreground">
								Busser automatically calculates the ABV of your cocktails, shows which drinks you
								can make with your current inventory, and even suggests what's "almost available" if
								you're just one ingredient short.
							</p>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Step 4: Discover -->
		<Card.Root class="relative overflow-hidden">
			<div class="absolute left-0 top-0 bottom-0 w-1 bg-violet-500"></div>
			<Card.Content class="py-5 pl-6">
				<div class="flex items-start gap-4">
					<div
						class="w-10 h-10 rounded-full bg-violet-500 text-white flex items-center justify-center shrink-0 font-bold"
					>
						4
					</div>
					<div class="flex-1">
						<h3 class="text-lg font-semibold flex items-center gap-2 mb-2">
							<GlassWater class="h-5 w-5 text-violet-500" />
							Discover & Enjoy
						</h3>
						<p class="text-sm text-muted-foreground mb-3">
							With your inventory stocked and recipes cataloged, Busser becomes your bartending
							companion. Browse your catalog filtered by what you can make tonight, explore by
							spirit category, or use the tools section for helpful calculators.
						</p>
						<div class="flex flex-wrap gap-2">
							<Badge variant="secondary" class="text-xs">
								<CircleCheck class="h-3 w-3 mr-1 text-green-500" />
								Available Now
							</Badge>
							<Badge variant="secondary" class="text-xs">
								<Search class="h-3 w-3 mr-1" />
								Browse by Spirit
							</Badge>
							<Badge variant="secondary" class="text-xs">
								<FlaskConical class="h-3 w-3 mr-1" />
								Super Juice Calculator
							</Badge>
							<Badge variant="secondary" class="text-xs">
								<GlassWater class="h-3 w-3 mr-1" />
								BAC Estimator
							</Badge>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</div>
</div>

<!-- Get Started CTA (only for non-authenticated users) -->
{#if !data.user}
	<Card.Root
		class="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30"
	>
		<Card.Content class="text-center py-8">
			<h2 class="text-xl font-bold mb-2">Ready to Elevate Your Home Bar?</h2>
			<p class="text-muted-foreground mb-6 max-w-md mx-auto">
				Create a free account to start tracking your inventory and discovering new cocktails today.
			</p>
			<div class="flex flex-col sm:flex-row gap-3 justify-center">
				<a href="/signup" class={buttonVariants({ size: 'lg' })}>
					Get Started Free
					<ArrowRight class="ml-2 h-4 w-4" />
				</a>
				<a href="/login" class={buttonVariants({ variant: 'outline', size: 'lg' })}> Log In </a>
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
