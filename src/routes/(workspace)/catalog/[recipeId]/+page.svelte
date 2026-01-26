<script lang="ts">
	import type { PageData } from './$types';
	import Recipe from '$lib/components/Recipe.svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.recipe.recipeName} - Catalog</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4">
	<!-- Back navigation -->
	<div class="mb-4 mt-4">
		<a href="/catalog" class={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2")}>
			<ArrowLeft class="h-4 w-4" />
			Back to Catalog
		</a>
	</div>

	<Recipe recipe={data.recipe} recipeSteps={data.recipeSteps} />
</div>
