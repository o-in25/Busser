<script lang="ts">
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import type { ActionData, PageData } from './$types';
	import CatalogForm from '$lib/components/CatalogForm.svelte';

	export let data: PageData;
	export let form: ActionData;

	const {
		args: { recipe, recipeSteps, spirits, preparationMethods },
	} = data;
</script>

<svelte:head>
	<title>Edit {recipe.recipeName} - Busser</title>
</svelte:head>
<Breadcrumb
	name="Catalog"
	href="/catalog"
>
	<BreadcrumbItem
		name={recipe.recipeName}
		href="/catalog/{recipe.recipeId}"
	></BreadcrumbItem>
	<BreadcrumbItem name="Edit"></BreadcrumbItem>
</Breadcrumb>
<h2 class="text-3xl mb-4 font-extrabold flex flex-row justify-between">
	Edit {recipe.recipeName}
</h2>
<div class="md:px-4 py-2 md:py-4">
	<CatalogForm
		{spirits}
		{preparationMethods}
		{recipe}
		{recipeSteps}
	/>
</div>
