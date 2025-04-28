<script lang="ts">
	import type { Spirit, View } from '$lib/types';
	import { Heading, P, Skeleton } from 'flowbite-svelte';
	import CatalogItem from './CatalogItem.svelte';
	import FancyImage from './FancyImage.svelte';
	import IconList from './IconList.svelte';
	import type { CatalogGeneratorSchema } from '$lib/server/generators/catalog-generator';
	import { onMount } from 'svelte';

	// props
	export let spirit: Spirit;
	export let recipes: View.BasicRecipe[] | [];

	let content: CatalogGeneratorSchema;
	const handleInput = () => {};
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
		<!-- <Heading tag="h4" class="mb-2">
      {spirit.recipeCategoryDescription}
    </Heading> -->
		<P
			color="text-gray-500 dark:text-gray-400"
			class="mb-6"
		>
			{spirit.recipeCategoryDescriptionText}
		</P>

		<div class="flex flex-row flex-nowrap justify-center">
			{#if content}
				<div class="flex-1">
					<IconList
						type="success"
						list={content.goodWith}
						heading="Good With"
					/>
				</div>

				<div class="flex-1">
					<IconList
						type="error"
						list={content.avoidWith}
						heading="Avoid With"
					/>
				</div>
			{:else}
				<div class="flex-1">
					<Skeleton
						size="sm"
						divClass="!max-w-full"
					/>
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
		<Heading
			tag="h6"
			customSize="text-md font-semibold"
			class="text-md font-semibold text-gray-900 dark:text-white"
		>
			History
		</Heading>
		<P color="text-gray-500 dark:text-gray-400">
			{content.history}
		</P>
	{:else}
		<Skeleton
			size="sm"
			divClass="!max-w-full"
		/>
	{/if}
</div>

<Heading
	tag="h5"
	class="mb-2"
>
	Cocktails With {spirit.recipeCategoryDescription}
</Heading>

<div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
	{#each recipes as recipe}
		<CatalogItem {recipe} />
	{/each}
</div>
