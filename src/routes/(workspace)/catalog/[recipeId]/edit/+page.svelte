<script lang="ts">
	import type { PageData } from './$types';
	import CatalogForm from '$lib/components/CatalogForm.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Edit {data.recipe.recipeName} - Catalog</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<a href="/catalog/{data.recipe.recipeId}" class={cn(buttonVariants({ variant: "ghost", size: "icon" }))}>
			<ArrowLeft class="h-5 w-5" />
		</a>
		<div>
			<h1 class="text-2xl font-bold">Edit Recipe</h1>
			<p class="text-muted-foreground">Update {data.recipe.recipeName}</p>
		</div>
	</div>

	<CatalogForm
		spirits={data.spirits}
		preparationMethods={data.preparationMethods}
		recipe={data.recipe}
		recipeSteps={data.recipeSteps}
	/>
</div>
