<script lang="ts">
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import type { PageData } from './$types';
	import Recipe from '$lib/components/Recipe.svelte';
	import type { View } from '$lib/types';

	export let data: PageData;
	const { result } = data;
	let recipe: View.BasicRecipe = {} as View.BasicRecipe;
	let recipeSteps: View.BasicRecipeStep[] = [] as View.BasicRecipeStep[];

	if ('data' in result) {
		if (result.data?.recipe) {
			recipe = result.data?.recipe;
		}
		if (result.data?.recipeSteps) {
			recipeSteps = result.data?.recipeSteps;
		}
	}
</script>

<svelte:head>
	<title>{recipe.recipeName} - Busser</title>
</svelte:head>
<Breadcrumb
	name="Catalog"
	href="/catalog"
>
	<BreadcrumbItem
		name="Browse Catalog"
		href="/catalog/browse"
	></BreadcrumbItem>
	<BreadcrumbItem name={recipe.recipeName}></BreadcrumbItem>
</Breadcrumb>
<!-- <Heading tag="h2" class="mb-4 font-extrabold flex flex-row justify-between">
  {recipe.recipeName}
</Heading> -->

<div class="px-4 py-2 md:py-4">
	{#if 'data' in result}
		<Recipe
			{recipe}
			{recipeSteps}
		/>
	{/if}
</div>
