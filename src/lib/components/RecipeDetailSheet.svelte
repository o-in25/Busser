<script lang="ts">
	import { FlaskConical, type Martini, Percent } from 'lucide-svelte';

	import SkeletonImage from '$lib/components/SkeletonImage.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Sheet from '$lib/components/ui/sheet';
	import type { View } from '$lib/types';

	import RecipeVerdictCard from './RecipeVerdictCard.svelte';

	let {
		open = $bindable(false),
		recipe,
		recipeSteps,
		abv,
		ingredientCount,
		ServingIcon,
	}: {
		open?: boolean;
		recipe: View.BasicRecipe;
		recipeSteps: View.BasicRecipeStep[];
		abv: string;
		ingredientCount: number;
		ServingIcon: typeof Martini;
	} = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content
		side="bottom"
		showClose={false}
		class="rounded-t-2xl max-h-[85vh] overflow-y-auto bg-white/60 dark:bg-white/[0.08] border-white/45 dark:border-white/[0.09] backdrop-saturate-[1.7]"
	>
		<Sheet.Header class="sr-only">
			<Sheet.Title>Recipe details</Sheet.Title>
		</Sheet.Header>

		<div class="space-y-4">
			<div class="relative rounded-xl overflow-hidden">
				<SkeletonImage
					src={recipe.recipeImageUrl}
					alt={recipe.recipeName}
					variant="recipe"
					class="w-full"
					sizes="100vw"
				/>
			</div>

			<div>
				<Badge size="lg" variant="secondary" class="mb-3 !text-sm">
					{recipe.recipeCategoryDescription}
				</Badge>
				<h2 class="text-2xl font-bold text-foreground">{recipe.recipeName}</h2>
			</div>

			<div class="flex flex-wrap items-center gap-2">
				<Badge size="lg" class="!py-1 !px-3 !text-xs !gap-1.5">
					<Percent class="h-3.5 w-3.5" />
					{abv}
				</Badge>
				<Badge size="lg" class="!py-1 !px-3 !text-xs !gap-1.5">
					<ServingIcon class="h-3.5 w-3.5" />
					{recipe.recipeTechniqueDescriptionText}
				</Badge>
				<Badge size="lg" class="!py-1 !px-3 !text-xs !gap-1.5">
					<FlaskConical class="h-3.5 w-3.5" />
					{ingredientCount} ingredients
				</Badge>
			</div>

			<RecipeVerdictCard {recipe} {recipeSteps} />

			<Button variant="outline" class="w-full" onclick={() => (open = false)}>Close</Button>
		</div>
	</Sheet.Content>
</Sheet.Root>
