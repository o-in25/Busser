<script lang="ts">
	import { ArrowRight, Bot, Github, Sparkles, Target, Users } from 'lucide-svelte';

	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';

	import * as Card from '$lib/components/ui/card';

	import cocktaildbLogo from '$lib/assets/thecocktaildb-logo.png';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// grounded differentiators, each maps to a shipped feature not a generic blurb
	const DIFFERENTIATORS = [
		{
			icon: Sparkles,
			color: 'text-primary',
			title: 'Availability, not a wall of recipes',
			body: 'Every recipe is checked against what you actually have in stock, so the catalog shows what you can pour right now instead of what you might buy for someday.',
		},
		{
			icon: Target,
			color: 'text-neon-amber-500',
			title: '"Almost there"',
			body: "Recipes you're a single ingredient away from surface on their own, so one bottle can unlock a handful of new drinks.",
		},
		{
			icon: Users,
			color: 'text-neon-cyan-500',
			title: 'Shared bars',
			body: 'A workspace can be shared with viewer, editor, or owner roles. Manage one bar together instead of each keeping a separate list.',
		},
		{
			icon: Bot,
			color: 'text-secondary-500',
			title: 'An assistant that acts on your bar',
			body: 'A built-in assistant answers cocktail questions and can make changes for you, alongside tools like the super juice and BAC calculators.',
		},
	];

	const FAQ = [
		{
			q: 'Is Busser free?',
			a: 'Yes. Busser is free to use and open source.',
		},
		{
			q: 'Do I have to enter every bottle I own?',
			a: 'No. Add whatever you want tracked. Pull items from the catalog or add a house item by hand, and the more you stock the more recipes light up.',
		},
		{
			q: 'Can I share my bar with someone?',
			a: 'Yes. Invite others into a workspace as a viewer, editor, or owner depending on how much control you want to give them.',
		},
		{
			q: 'Where do the recipe images come from?',
			a: 'Ingredient and recipe imagery is powered by TheCocktailDB.',
		},
	];
</script>

<svelte:head>
	<title>About - Busser</title>
	<meta
		name="description"
		content="What Busser is and why it exists. A free, open-source home bar app that shows you the cocktails you can actually make with the bottles you own."
	/>
</svelte:head>

<!-- Hero -->
<div class="mb-12">
	<h1 class="text-3xl md:text-4xl font-bold mb-4">About Busser</h1>
	<p class="text-lg text-muted-foreground max-w-2xl">
		Busser is a free, open-source home bar app built around one idea:
		<span
			class="font-bold text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 via-primary-500 to-neon-amber-500"
		>
			show me what I can make with what I have on hand
		</span>.
	</p>
</div>

<!-- Founder story -->
<div class="mb-12 max-w-2xl">
	<h2 class="text-2xl font-bold mb-4">Why I built Busser</h2>
	<div class="space-y-4 text-muted-foreground">
		<p>
			When I first got into home bartending, I kept running into the same problem of trying to keep
			a growing shelf of ingredients with no real way to know what I could actually make with them.
			Some spirits and liqueurs can last almost indefinitely when stored properly, while juices or
			mixers can spoil in just a few days. It began getting tougher and tougher to justify the cost
			of these expensive ingredients when my inventory management system at the time consisted of a
			series of Post-it notes written with a Sharpie.
		</p>
		<p>
			Around that time, I was itching to start a new project, and this real problem of my own was
			perfect excuse. So I started building Busser: a tool that tracks what I have in stock and
			shows me what I can pour with it.
		</p>
		<p>
			What I thought would be an easy job of matching ingredients to drinks kept turning up
			questions I didn't expect. How do you handle a drink like a Moscow Mule, which works with just
			about any vodka, next to a Dark 'N' Stormy, a trademarked drink that specifically needs
			Gosling's Black Seal rum? When you're on a budget and can only stock a few bottles, how do you
			know which ones give you the best bang for your buck? And as Busser grew from my own pet
			project into something other people could use, how do you keep one person's bar from turning
			into everybody else's?
		</p>
		<p>
			Working through problems like these has helped Busser grow from a personal pet project into a
			flexible platform for home bartenders and enthusiasts alike to get more out of their bar, with
			custom workspaces, smart inventory management, and a magazine of cocktail and spirit related
			history and science I've curated over years of reading books, gathering history, and making
			cocktails at home.
		</p>
		<p>
			Whether you're a casual imbiber, a weekend-warrior enthusiast, or a professional mixologist, I
			hope Busser gives you a better way to manage your bar. Come say hello on our social pages, or
			dig into the code and contribute to the
			<a
				href="https://github.com/o-in25/Busser"
				target="_blank"
				rel="noopener noreferrer"
				class="focus-ring text-primary hover:underline font-medium">open source project</a
			>. Cheers!
		</p>
		<p class="italic">— Eoin</p>
	</div>
</div>

<!-- What makes it different -->
<div class="mb-12">
	<h2 class="text-2xl font-bold mb-6">What makes it different</h2>
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each DIFFERENTIATORS as { icon: Icon, color, title, body }}
			<Card.Root class="h-full">
				<Card.Content class="py-5">
					<div class="flex items-start gap-3">
						<div class="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
							<Icon class="h-5 w-5 {color}" />
						</div>
						<div>
							<h3 class="font-semibold mb-1">{title}</h3>
							<p class="text-sm text-muted-foreground">{body}</p>
						</div>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</div>

<!-- Status & trust -->
<div class="mb-12 max-w-2xl">
	<h2 class="text-2xl font-bold mb-4">Where things stand</h2>
	<div class="flex flex-wrap gap-2 mb-4">
		<Badge variant="secondary">Free</Badge>
		<Badge variant="secondary">Open source</Badge>
		<Badge variant="secondary">Invitation-only · early access</Badge>
	</div>
	<p class="text-muted-foreground">
		Busser is in active, early development and currently invitation-only. It's open source, so you
		can read the code, file issues, or contribute on
		<a
			href="https://github.com/o-in25/Busser"
			target="_blank"
			rel="noopener noreferrer"
			class="focus-ring text-primary hover:underline font-medium inline-flex items-center gap-1"
		>
			<Github class="h-4 w-4" />
			GitHub
		</a>. Want in? You can
		<a href="/" class="focus-ring text-primary hover:underline font-medium">request an invite</a>
		from the home page.
	</p>
</div>

<!-- FAQ -->
<div class="mb-12">
	<h2 class="text-2xl font-bold mb-6">Common questions</h2>
	<div class="space-y-3 max-w-2xl">
		{#each FAQ as { q, a }}
			<Card.Root>
				<Card.Content class="py-4">
					<h3 class="font-semibold mb-1">{q}</h3>
					<p class="text-sm text-muted-foreground">{a}</p>
				</Card.Content>
			</Card.Root>
		{/each}
		<Card.Root>
			<Card.Content class="py-4">
				<h3 class="font-semibold mb-1">Is my data private?</h3>
				<p class="text-sm text-muted-foreground">
					See our
					<a href="/privacy" class="focus-ring text-primary hover:underline">privacy policy</a>
					and
					<a href="/terms" class="focus-ring text-primary hover:underline">terms</a> for how your data
					is handled.
				</p>
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
				<Button variant="cta-primary" size="cta" href="/signup">
					Get Started Free
					<ArrowRight class="ml-2 h-4 w-4" />
				</Button>
				<Button variant="cta" size="cta" href="/login">Log In</Button>
			</div>
		</Card.Content>
	</Card.Root>
{/if}

<!-- Contact -->
<div class="text-center mt-8 pt-6 border-t border-border">
	<p class="text-sm text-muted-foreground">
		Have questions or feedback? Contact us at
		<a
			href="mailto:support@busserapp.com"
			class="focus-ring text-primary hover:underline font-medium"
		>
			support@busserapp.com
		</a>
	</p>
	<p
		class="text-sm text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1"
	>
		<span>Ingredient & recipe imagery powered by</span>
		<a
			href="https://www.thecocktaildb.com"
			target="_blank"
			rel="noopener noreferrer"
			class="focus-ring inline-flex rounded"
			aria-label="TheCocktailDB"
		>
			<img
				src={cocktaildbLogo}
				alt="TheCocktailDB"
				width="130"
				height="34"
				class="h-[26px] w-auto opacity-90 transition-opacity hover:opacity-100"
			/>
		</a>
	</p>
</div>
