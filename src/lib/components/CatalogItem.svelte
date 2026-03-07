<script lang="ts">
	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import * as Card from '$lib/components/ui/card';
	import type { View } from '$lib/types';
	export let recipe: View.BasicRecipe;
</script>

<a href="/catalog/{recipe.recipeId}" class="block">
	<Card.Root class="cursor-pointer transition hover:bg-accent p-3">
		<div class="flex justify-center">
			<div class="p-4 m-auto">
				<SkeletonImage
					src={recipe.recipeImageUrl}
					alt={recipe.recipeDescription || 'Recipe Image'}
					variant="recipe"
					class="h-16 w-16 rounded-full"
				/>
			</div>
			<div class="flex-1">
				<h3 class="text-lg font-bold">{recipe.recipeName}</h3>
				<p class="text-sm text-muted-foreground">
					{recipe.recipeCategoryDescription}
				</p>
				<p class="text-sm line-clamp-2">
					{recipe.recipeDescription}
				</p>
			</div>
		</div>
	</Card.Root>
</a>
