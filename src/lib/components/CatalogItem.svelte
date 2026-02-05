<script lang="ts">
	import ImagePlaceholder from '$lib/components/ImagePlaceholder.svelte';
	import * as Avatar from '$lib/components/ui/avatar';
	import * as Card from '$lib/components/ui/card';
	import type { View } from '$lib/types';
	export let recipe: View.BasicRecipe;
</script>

<a href="/catalog/{recipe.recipeId}" class="block">
	<Card.Root class="cursor-pointer transition hover:bg-accent active:scale-95 p-3">
		<div class="flex justify-center">
			<div class="p-4 m-auto">
				{#if recipe.recipeImageUrl}
					<Avatar.Root class="h-16 w-16">
						<Avatar.Image
							src={recipe.recipeImageUrl}
							alt={recipe.recipeDescription || 'Recipe Image'}
						/>
						<Avatar.Fallback>{recipe.recipeName?.charAt(0) || 'R'}</Avatar.Fallback>
					</Avatar.Root>
				{:else}
					<div class="h-16 w-16 rounded-full overflow-hidden">
						<ImagePlaceholder variant="recipe" class="w-8 h-8" />
					</div>
				{/if}
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
