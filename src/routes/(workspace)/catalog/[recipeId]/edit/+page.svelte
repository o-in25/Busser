<script lang="ts">
	import CatalogForm from '$lib/components/CatalogForm.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Edit {data.recipe.recipeName} - Catalog</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<CatalogForm
		spirits={data.spirits}
		preparationMethods={data.preparationMethods}
		recipe={data.recipe}
		recipeSteps={data.recipeSteps}
	/>
</div>
