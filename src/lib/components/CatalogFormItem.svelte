<script lang="ts">
	import { Minus } from 'lucide-svelte';

	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { View } from '$lib/types';

	import Autocomplete from './Autocomplete.svelte';

	// props
	export let step: View.BasicRecipeStep;
	export let stepNumber: number;
	export let clickHandler: Function;

	// Convert productId to/from string for Autocomplete
	let productIdValue: string | null = step.productId ? String(step.productId) : null;
	$: step.productId = productIdValue ? parseInt(productIdValue, 10) : 0;
</script>

<Card.Root class="relative mx-auto">
	<Card.Header>
		<Card.Title>Step {stepNumber + 1}</Card.Title>
	</Card.Header>
	<Card.Content>
		{#if stepNumber > 0}
			<button
				class="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 border-2 border-background flex items-center justify-center text-white hover:bg-red-600 transition-colors"
				onclick={() => clickHandler(stepNumber)}
			>
				<Minus class="w-4 h-4" />
			</button>
		{/if}

		<!-- product name -->
		<div class="mb-6">
			<Autocomplete
				label="Inventory Item"
				placeholder="Whiskey"
				name="productId"
				fetchUrl="/api/select/products"
				bind:value={productIdValue}
				key={step.productName}
			/>
		</div>

		<div class="mb-6">
			<Label for="recipeStepDescription" class="mb-2">Amount</Label>
			<div class="flex">
				<Input
					type="number"
					class="rounded-r-none"
					value={String(step.productIdQuantityInMilliliters)}
					oninput={(e) =>
						(step.productIdQuantityInMilliliters = parseFloat(e.currentTarget.value) || 0)}
					step="0.25"
				/>
				<select
					name="productIdQuantityUnit"
					class="shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center bg-muted border border-input rounded-r-lg hover:bg-accent focus:ring-2 focus:outline-none focus:ring-ring"
					bind:value={step.productIdQuantityUnit}
				>
					{#each ['oz', 'ml', 'dash', 'cube'] as unit}
						<option selected>{unit}</option>
					{/each}
				</select>
			</div>
		</div>
		<!-- description -->
		<div class="mb-6">
			<Label for="recipeStepDescription" class="mb-2">Description</Label>
			<Textarea rows={4} bind:value={step.recipeStepDescription} />
		</div>
	</Card.Content>
</Card.Root>
