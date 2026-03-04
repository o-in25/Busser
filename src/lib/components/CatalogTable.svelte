<script lang="ts">
	import { Info } from 'lucide-svelte';

	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import * as Card from '$lib/components/ui/card';
	import type { BasicRecipe } from '$lib/types';

	export let recipes: BasicRecipe[];
</script>

<Card.Root class="mx-auto glass-card p-6">
	<div class="divide-y divide-border">
		{#each recipes as recipe}
			<a
				href="/catalog/{recipe.recipeId}"
				class="flex items-center space-x-4 rtl:space-x-reverse py-3 px-2 rounded-lg hover:bg-primary/5 transition-colors"
			>
				<SkeletonImage
					src={recipe.recipeImageUrl}
					alt={recipe.recipeDescription || ''}
					variant="recipe"
					class="h-12 w-12 rounded-full flex-shrink-0"
				/>
				<div class="flex-1 min-w-0">
					<p class="text-sm font-medium text-foreground truncate">
						{recipe.recipeName}
						<span class="block text-sm font-light text-muted-foreground">
							{recipe.recipeCategoryDescription}
						</span>
					</p>
					<p class="text-sm text-muted-foreground truncate">
						{recipe.recipeDescription}
					</p>
				</div>
			</a>
		{/each}
		{#if !recipes.length}
			<div class="flex flex-col items-center py-4">
				<Alert>
					<Info class="h-4 w-4" />
					<AlertDescription>No Results</AlertDescription>
				</Alert>
			</div>
		{/if}
	</div>
</Card.Root>
