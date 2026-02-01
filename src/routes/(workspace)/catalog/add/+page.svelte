<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import CatalogForm from '$lib/components/CatalogForm.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Add Recipe - Catalog</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<BackButton fallback="/catalog" />
		<div>
			<h1 class="text-2xl font-bold">Add New Recipe</h1>
			<p class="text-muted-foreground">Create a new cocktail recipe for your catalog</p>
		</div>
	</div>

	<CatalogForm spirits={data.spirits} preparationMethods={data.preparationMethods} />
</div>
