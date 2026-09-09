<script lang="ts">
	import { Citrus, Mail, Wine } from 'lucide-svelte';

	import { page } from '$app/stores';
	import BacCalculator from '$lib/components/BacCalculator.svelte';
	import Calculator from '$lib/components/Calculator.svelte';
	import Callout from '$lib/components/Callout.svelte';
	import { Button } from '$lib/components/ui/button';
	import PageHero from '$lib/components/PageHero.svelte';
	import * as Card from '$lib/components/ui/card';

	let { data } = $props();

	const authenticated = $derived(!!$page.data.user);

	const SUPER_JUICE_ARTICLE = 'https://punchdrink.com/articles/super-juice-lime-daiquiri-recipe/';
	const SUPER_JUICE_VIDEO_ID = 'eiNMAm42C8U';
	let showVideo = $state(false);
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
						<Card.Title class="text-xl">Super Juice Calculator</Card.Title>
						<Card.Description class="mt-1">
							Calculate the perfect ratios for making
							<a
								href={SUPER_JUICE_ARTICLE}
								target="_blank"
								rel="noopener noreferrer"
								class="focus-ring text-primary hover:underline">super juice</a
							>, a bartending technique that maximizes citrus yield and extends shelf life by
							extracting flavor from peels using citric and malic acids.
						</Card.Description>

						<!-- facade — hold off loading youtube's player until the user clicks -->
						<div class="mt-4 max-w-sm">
							{#if showVideo}
								<div class="aspect-video overflow-hidden rounded-xl border border-white/10">
									<iframe
										class="h-full w-full"
										src={`https://www.youtube-nocookie.com/embed/${SUPER_JUICE_VIDEO_ID}?autoplay=1`}
										title="How to make super juice"
										allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
										allowfullscreen
									></iframe>
								</div>
							{:else}
								<button
									type="button"
									onclick={() => (showVideo = true)}
									aria-label="Play video: how to make super juice"
									class="focus-ring group relative block aspect-video w-full overflow-hidden rounded-xl border border-white/10"
								>
									<img
										src={`https://img.youtube.com/vi/${SUPER_JUICE_VIDEO_ID}/hqdefault.jpg`}
										alt=""
										loading="lazy"
										class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
									/>
									<span
										class="absolute inset-0 grid place-items-center bg-black/30 transition-colors group-hover:bg-black/20"
									>
										<span
											class="grid h-12 w-12 place-items-center rounded-full bg-primary/90 shadow-lg"
										>
											<Play class="h-5 w-5 translate-x-0.5 text-white" fill="currentColor" />
										</span>
									</span>
								</button>
							{/if}
						</div>
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
