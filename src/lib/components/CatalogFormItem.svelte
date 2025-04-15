<script lang="ts">
	import { Card, Label, Textarea, Indicator, Input } from 'flowbite-svelte';
	import Autocomplete from './Autocomplete.svelte';
	import { MinusOutline } from 'flowbite-svelte-icons';
	import type { View } from '$lib/types';
	import Heading from 'flowbite-svelte/Heading.svelte';

	// props
	export let step: View.BasicRecipeStep;
	export let stepNumber: number;
	export let clickHandler: Function;
	const selectClass =
		'shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-500 bg-gray-100 border border-gray-300 rounded-e-lg hover:bg-gray-200 focus:ring-4 focus:outline-hidden focus:ring-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 dark:text-white dark:border-gray-600';
</script>

<Card
	size="xl"
	class="relative mx-auto"
>
	<Heading tag="h6">Step {stepNumber + 1}</Heading>
	<!-- <h6>{step}</h6> -->
	{#if stepNumber > 0}
		<button on:click|preventDefault={() => clickHandler(stepNumber)}>
			<Indicator
				color="red"
				border
				size="xl"
				placement="top-right"
			>
				<span class="text-white text-xs font-bold"><MinusOutline /></span>
			</Indicator>
		</button>
	{/if}

	<!-- product name -->
	<div class="mb-6">
		<Autocomplete
			label="Inventory Item"
			placeholder="Whiskey"
			name="productId"
			fetchUrl="/api/select/products"
			bind:value={step.productId}
			key={step.productName}
		/>
	</div>

	<div class="mb-6">
		<Label
			for="recipeStepDescription"
			class="mb-2"
		>
			Amount
		</Label>
		<div class="flex">
			<Input
				name="productIdQuantityInMilliliters"
				type="number"
				class="!rounded-e-none"
				bind:value={step.productIdQuantityInMilliliters}
				step="0.25"
			/>
			<select
				name="productIdQuantityUnit"
				class={selectClass}
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
		<Label
			for="recipeStepDescription"
			class="mb-2"
		>
			Description
		</Label>
		<Textarea
			rows={4}
			bind:value={step.recipeStepDescription}
		/>
	</div>
</Card>
