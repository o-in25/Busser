<script lang="ts">
	import { Citrus, HelpCircle, Mail, Wine } from 'lucide-svelte';

	import { page } from '$app/stores';
	import BacCalculator from '$lib/components/BacCalculator.svelte';
	import Calculator from '$lib/components/Calculator.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import { Button } from '$lib/components/ui/button';
	import PageHero from '$lib/components/PageHero.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Popover from '$lib/components/ui/popover';

	let { data } = $props();

	const authenticated = $derived(!!$page.data.user);
</script>

<svelte:head>
	<title>Tools - Busser</title>
</svelte:head>

{#if !authenticated}
	<Callout class="mb-6">
		{#snippet icon()}<Mail class="h-5 w-5 text-primary" />{/snippet}
		{#snippet children()}
			<p class="sm:hidden">Sign up to build your own bar</p>
			<p class="hidden sm:block">
				Sign up to <strong>build your own bar</strong> and manage your inventory.
			</p>
		{/snippet}
		{#snippet action()}
			<Button variant="cta-primary" size="cta-sm" href="/signup">Sign Up</Button>
		{/snippet}
	</Callout>
{/if}

{#if authenticated}
	<PageHero title="Tools" subtitle="Bartending calculators and utilities" />
{:else}
	<!-- logged-out: hero swapped for the sign-up banner above; keep a heading for seo/a11y -->
	<h1 class="sr-only">Bartending Tools</h1>
{/if}

<div class="space-y-6">
	<!-- Tools Grid -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Super Juice Calculator Card -->
		<Card.Root class="lg:col-span-2">
			<Card.Header>
				<div class="flex items-start gap-4">
					<div class="p-3 rounded-xl bg-lime-500/10">
						<Citrus class="h-6 w-6 text-lime-500" />
					</div>
					<div class="flex-1">
						<Card.Title class="text-xl flex items-center gap-1.5">
							Super Juice Calculator
							<Popover.Root>
								<Popover.Trigger
									class="text-muted-foreground hover:text-foreground transition-colors rounded-full"
								>
									<HelpCircle class="h-4 w-4" />
									<span class="sr-only">What is super juice?</span>
								</Popover.Trigger>
								<Popover.Content class="w-72 text-sm text-left" align="start">
									<p class="font-semibold mb-1">What is super juice?</p>
									<p class="text-muted-foreground mb-2">
										Super juice is a technique created by Nickle Morris that uses citric and malic
										acids to extract maximum flavor from citrus peels, yielding up to 8x more juice
										with a longer shelf life.
									</p>
									<div class="flex flex-col gap-1">
										<a
											href="https://punchdrink.com/articles/super-juice-lime-daiquiri-recipe/"
											target="_blank"
											rel="noopener noreferrer"
											class="text-xs text-primary hover:underline"
										>
											Read the article
										</a>
										<a
											href="https://www.youtube.com/watch?v=eiNMAm42C8U"
											target="_blank"
											rel="noopener noreferrer"
											class="text-xs text-primary hover:underline"
										>
											Watch the video
										</a>
									</div>
								</Popover.Content>
							</Popover.Root>
						</Card.Title>
						<Card.Description class="mt-1">
							Calculate the perfect ratios for making super juice — a bartending technique that
							maximizes citrus yield and extends shelf life by extracting flavor from peels using
							citric and malic acids.
						</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<Calculator />
			</Card.Content>
		</Card.Root>

		<!-- BAC Estimator Card -->
		<Card.Root class="lg:col-span-2 overflow-visible relative z-10">
			<Card.Header>
				<div class="flex items-start gap-4">
					<div class="p-3 rounded-xl bg-rose-500/10">
						<Wine class="h-6 w-6 text-rose-500" />
					</div>
					<div class="flex-1">
						<Card.Title class="text-xl">BAC Estimator</Card.Title>
						<Card.Description class="mt-1">
							Estimate blood alcohol content based on cocktails consumed. For educational purposes
							and promoting responsible consumption.
						</Card.Description>
					</div>
				</div>
			</Card.Header>
			<Card.Content>
				<BacCalculator recipes={data.bacCalculatorRecipes} />
			</Card.Content>
		</Card.Root>
	</div>
</div>
