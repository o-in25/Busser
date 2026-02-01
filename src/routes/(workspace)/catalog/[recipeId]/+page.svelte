<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import Recipe from '$lib/components/Recipe.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.recipe.recipeName} - Catalog</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4">
	<!-- Back navigation -->
	<div class="mb-4 mt-4">
		<BackButton fallback="/catalog" label="Back to Catalog" size="sm" />
	</div>

	<Recipe recipe={data.recipe} recipeSteps={data.recipeSteps} />
</div>
