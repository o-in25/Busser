<script lang="ts">
	import { Card, Avatar } from 'flowbite-svelte';
	import placeholderLight from '$lib/assets/placeholder-alt-light.png';
	import placeholderDark from '$lib/assets/placeholder-alt-dark.png';
	import type { View } from '$lib/types';
	export let recipe: View.BasicRecipe;
</script>

<Card
	size="xl"
	padding="sm"
	class="cursor-pointer transition hover:bg-gray-100 active:scale-95"
	href="/catalog/{recipe.recipeId}"
>
	<div class="flex justify-center">
		<div class="dark:hidden p-4 m-auto">
			<Avatar
				src={recipe.recipeImageUrl || placeholderLight}
				alt={recipe.recipeDescription || 'Recipe Image'}
				class=""
			/>
		</div>
		<div class="p-4 m-auto hidden dark:block">
			<Avatar
				src={recipe.recipeImageUrl || placeholderDark}
				alt={recipe.recipeDescription || 'Recipe Image'}
				class=""
			/>
		</div>
		<div class="flex-1">
			<h3 class="text-lg font-bold">{recipe.recipeName}</h3>
			<p class="text-sm text-gray-500">
				{recipe.recipeCategoryDescription}
			</p>
			<p class="text-sm line-clamp-2">
				{recipe.recipeDescription}
			</p>
		</div>
	</div>
</Card>
