<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Avatar from '$lib/components/ui/avatar';
	import placeholderLight from '$lib/assets/placeholder-alt-light.png';
	import placeholderDark from '$lib/assets/placeholder-alt-dark.png';
	import type { View } from '$lib/types';
	export let recipe: View.BasicRecipe;
</script>

<a href="/catalog/{recipe.recipeId}" class="block">
	<Card.Root class="cursor-pointer transition hover:bg-accent active:scale-95 p-3">
		<div class="flex justify-center">
			<div class="dark:hidden p-4 m-auto">
				<Avatar.Root class="h-16 w-16">
					<Avatar.Image
						src={recipe.recipeImageUrl || placeholderLight}
						alt={recipe.recipeDescription || 'Recipe Image'}
					/>
					<Avatar.Fallback>{recipe.recipeName?.charAt(0) || 'R'}</Avatar.Fallback>
				</Avatar.Root>
			</div>
			<div class="p-4 m-auto hidden dark:block">
				<Avatar.Root class="h-16 w-16">
					<Avatar.Image
						src={recipe.recipeImageUrl || placeholderDark}
						alt={recipe.recipeDescription || 'Recipe Image'}
					/>
					<Avatar.Fallback>{recipe.recipeName?.charAt(0) || 'R'}</Avatar.Fallback>
				</Avatar.Root>
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
