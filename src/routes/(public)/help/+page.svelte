<script lang="ts">
	import {
		ArrowRight,
		BookOpen,
		FlaskConical,
		FolderPlus,
		GlassWater,
		LifeBuoy,
		Mail,
		Package,
		Ruler,
		Sparkles,
		Users,
	} from 'lucide-svelte';

	import FancyButton from '$lib/components/FancyButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import { Collapsible } from '$lib/components/ui/collapsible';

	// quick links to the pages behind each answer
	const tutorials = [
		{
			href: '/inventory',
			icon: Package,
			title: 'Stock your inventory',
			description: 'Add the bottles and ingredients you have on hand.',
		},
		{
			href: '/catalog',
			icon: GlassWater,
			title: 'Browse the catalog',
			description: 'See which cocktails you can make right now.',
		},
		{
			href: '/assistant',
			icon: Sparkles,
			title: 'Ask Busser AI',
			description: 'Get recommendations and answers about your bar.',
		},
		{
			href: '/tools',
			icon: Ruler,
			title: 'Use the tools',
			description: 'Super juice ratios and a BAC estimator.',
		},
	];

	const faqs = [
		{
			icon: FolderPlus,
			question: 'What is a workspace?',
			answer:
				'A workspace is your personal or shared bar. It holds all of your bottles, ingredients, and recipes. You can keep one for your home bar and another for a friend’s place you help manage — each has its own separate inventory and catalog.',
		},
		{
			icon: Package,
			question: 'How do I add bottles and ingredients?',
			answer:
				'Head to Inventory and add items into categories like spirits, liqueurs, mixers, bitters, and fresh ingredients. Each item tracks details like proof, quantity, and price. Mark things in-stock or out-of-stock so Busser knows what you actually have.',
		},
		{
			icon: GlassWater,
			question: 'How does Busser know which cocktails I can make?',
			answer:
				'Recipes link to the items in your inventory. When everything a recipe needs is in stock, it shows up as available. If you’re just one ingredient short, Busser flags it as “almost available” so you know what to grab.',
		},
		{
			icon: FlaskConical,
			question: 'Can I add my own recipes?',
			answer:
				'Yes. In the Catalog you can add recipes with exact ingredient quantities, a technique (stirred, shaken, built, or blended), and flexible matching like “any bourbon” instead of a specific brand. Busser uses the technique and proof to estimate dilution and ABV automatically.',
		},
		{
			icon: Users,
			question: 'Can I share my bar with other people?',
			answer:
				'Invite others to a workspace with different permission levels. Viewers can browse the inventory and recipes, while editors can add and change items. It’s handy for couples managing a home bar together or friends planning a party.',
		},
		{
			icon: Sparkles,
			question: 'What is Busser AI?',
			answer:
				'Busser AI is an assistant that answers questions about your bar — what you can make tonight, substitution ideas, and recommendations based on what you have stocked.',
		},
		{
			icon: Ruler,
			question: 'What are the Tools?',
			answer:
				'The Tools section has a Super Juice calculator for getting citrus ratios right and a BAC estimator for gauging blood alcohol content based on the cocktails you’ve had. The estimator is for education and responsible consumption only.',
		},
	];
</script>

<svelte:head>
	<title>Help Center - Busser</title>
	<meta
		name="description"
		content="Busser help center — FAQs and quick tutorials for managing your home bar inventory, recipes, and workspaces."
	/>
</svelte:head>

<!-- Hero -->
<div class="mb-10">
	<div class="flex items-center gap-3 mb-4">
		<div class="p-2.5 rounded-xl bg-primary/10">
			<LifeBuoy class="h-6 w-6 text-primary" />
		</div>
		<h1 class="text-3xl md:text-4xl font-bold">Help Center</h1>
	</div>
	<p class="text-lg text-muted-foreground max-w-2xl">
		Answers to common questions and quick tutorials to get the most out of Busser. New here? The
		<a href="/about" class="text-primary hover:underline font-medium">full walkthrough</a> covers everything
		step by step.
	</p>
</div>

<!-- Quick tutorials -->
<div class="mb-10">
	<h2 class="text-xl font-bold mb-4 flex items-center gap-2">
		<BookOpen class="h-5 w-5 text-primary" />
		Quick tutorials
	</h2>
	<div class="grid gap-4 sm:grid-cols-2">
		{#each tutorials as tutorial}
			<a href={tutorial.href} class="group">
				<Card.Root class="h-full transition-colors hover:border-primary/40 hover:bg-muted/40">
					<Card.Content class="flex items-start gap-4 py-5">
						<div class="p-2.5 rounded-xl bg-primary/10 shrink-0">
							<tutorial.icon class="h-5 w-5 text-primary" />
						</div>
						<div class="flex-1">
							<h3 class="font-semibold flex items-center gap-1.5">
								{tutorial.title}
								<ArrowRight
									class="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5"
								/>
							</h3>
							<p class="text-sm text-muted-foreground mt-1">{tutorial.description}</p>
						</div>
					</Card.Content>
				</Card.Root>
			</a>
		{/each}
	</div>
</div>

<!-- FAQs -->
<div class="mb-10">
	<div class="flex items-center gap-2 mb-4">
		<h2 class="text-xl font-bold">Frequently asked questions</h2>
		<Badge variant="outline">FAQ</Badge>
	</div>
	<div class="space-y-3">
		{#each faqs as faq}
			<Collapsible title={faq.question} icon={faq.icon} open={false}>
				<p class="text-sm text-muted-foreground">{faq.answer}</p>
			</Collapsible>
		{/each}
	</div>
</div>

<!-- Contact -->
<Card.Root class="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/30">
	<Card.Content class="text-center py-8">
		<div class="flex justify-center mb-3">
			<div class="p-2.5 rounded-xl bg-primary/10">
				<Mail class="h-6 w-6 text-primary" />
			</div>
		</div>
		<h2 class="text-xl font-bold mb-2">Still need a hand?</h2>
		<p class="text-muted-foreground mb-6 max-w-md mx-auto">
			Can’t find what you’re looking for? Reach out and we’ll help you sort it out.
		</p>
		<FancyButton variant="primary" href="mailto:support@busserapp.com">
			<Mail class="mr-2 h-4 w-4" />
			Contact support
		</FancyButton>
	</Card.Content>
</Card.Root>
