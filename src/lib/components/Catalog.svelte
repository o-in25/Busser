<script lang="ts">
	import { onMount } from 'svelte';

	import { Skeleton } from '$lib/components/ui/skeleton';
	import type { CatalogGeneratorSchema } from '$lib/server/generators/catalog-generator';
	import type { Spirit, View } from '$lib/types';

	import CatalogItem from './CatalogItem.svelte';
	import FancyImage from './FancyImage.svelte';
	import IconList from './IconList.svelte';

	// props
	export let spirit: Spirit;
	export let recipes: View.BasicRecipe[] | [];

	let content: CatalogGeneratorSchema;

	// fetch generated content on load
	onMount(async () => {
		const result = await fetch(`/api/generator/catalog`, {
			method: 'POST',
			body: JSON.stringify({
				recipeName: spirit.recipeCategoryDescriptionText,
			}),
		});
		const response = await result.json();
		content = response;
	});
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
	<!-- col 1 -->
	<div>
		<p class="text-muted-foreground mb-6">
			{spirit.recipeCategoryDescriptionText}
		</p>

		<div class="flex flex-row flex-nowrap justify-center">
			{#if content}
				<div class="flex-1">
					<IconList type="success" list={content.goodWith} heading="Good With" />
				</div>

				<div class="flex-1">
					<IconList type="error" list={content.avoidWith} heading="Avoid With" />
				</div>
			{:else}
				<div class="flex-1 space-y-2">
					<Skeleton class="h-4 w-full" />
					<Skeleton class="h-4 w-3/4" />
					<Skeleton class="h-4 w-1/2" />
				</div>
			{/if}
		</div>
	</div>

	<!-- col 2 -->
	<div class="m-auto">
		<FancyImage
			src={spirit.recipeCategoryDescriptionImageUrl || ''}
			alt={spirit.recipeCategoryDescriptionText || ''}
		/>
	</div>
</div>

<div class="mb-6">
	{#if content}
		<h6 class="text-md font-semibold mb-2">History</h6>
		<p class="text-muted-foreground">
			{content.history}
		</p>
	{:else}
		<div class="space-y-2">
			<Skeleton class="h-4 w-full" />
			<Skeleton class="h-4 w-full" />
			<Skeleton class="h-4 w-3/4" />
		</div>
	{/if}
</div>

<h5 class="text-xl font-bold mb-2">
	Cocktails With {spirit.recipeCategoryDescription}
</h5>

<div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
	{#each recipes as recipe}
		<CatalogItem {recipe} />
	{/each}
</div>
