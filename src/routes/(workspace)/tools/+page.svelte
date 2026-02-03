<script lang="ts">
	import { Citrus, Wine, Wrench } from 'lucide-svelte';

	import BacCalculator from '$lib/components/BacCalculator.svelte';
	import Calculator from '$lib/components/Calculator.svelte';
	import * as Card from '$lib/components/ui/card';

	let { data } = $props();
</script>

<svelte:head>
	<title>Tools - Busser</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold">Tools</h1>
		<p class="text-sm text-muted-foreground mt-1">Bartending calculators and utilities</p>
	</div>

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
		<Card.Root class="lg:col-span-2">
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

		<!-- Placeholder for future tools -->
		<Card.Root class="border-dashed lg:col-span-2">
			<Card.Content class="flex flex-col items-center justify-center py-12 text-center">
				<div class="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
					<Wrench class="h-8 w-8 text-muted-foreground/50" />
				</div>
				<h3 class="font-semibold mb-1">More Tools Coming Soon</h3>
				<p class="text-sm text-muted-foreground max-w-md">
					We're working on adding more bartending utilities like dilution calculators, batch scaling
					tools, and cost analysis.
				</p>
			</Card.Content>
		</Card.Root>
	</div>
</div>
