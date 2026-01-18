<script lang="ts">
	import type { View } from '$lib/types';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Pencil } from 'lucide-svelte';
	import placeholderLight from '$lib/assets/placeholder-alt-light.png';
	import placeholderDark from '$lib/assets/placeholder-alt-dark.png';
	import {
		calculateAbv,
		calculateOverallScore,
		convertFromMl,
		getUnits,
	} from '$lib/math';
	import type { RecipeGeneratorSchema } from '$lib/server/generators/recipe-generator';
	import { getContext, onMount } from 'svelte';

	export let recipe: View.BasicRecipe;
	export let recipeSteps: View.BasicRecipeStep[];
	const permissions: string[] = getContext('permissions') || [];

	let content: RecipeGeneratorSchema;

	let steps = recipeSteps.map(step => ({ ...step, checked: false }));

	const getScore = () => {
		const ratingsMap = [
			{ max: 0, desc2: 'No Rating', style: 'bg-gray-500' },
			{ max: 1, desc2: 'Swill', style: 'bg-red-500' },
			{ max: 2, desc2: 'Forgettable', style: 'bg-red-500' },
			{ max: 3, desc2: 'Bottom Shelf', style: 'bg-red-500' },
			{ max: 4, desc2: 'Decent', style: 'bg-yellow-500' },
			{ max: 5, desc2: 'Standard Pour', style: 'bg-yellow-500' },
			{ max: 6, desc2: 'Good Stuff', style: 'bg-green-500' },
			{ max: 7, desc2: 'Top Shelf', style: 'bg-green-500' },
			{ max: 8, desc2: "Connoisseur's Choice", style: 'bg-green-500' },
			{ max: 9, desc2: "Bartender's Favorite", style: 'bg-blue-500' },
		];
		const score = calculateOverallScore(
			recipe.recipeVersatilityRating,
			recipe.recipeSweetnessRating,
			recipe.recipeDrynessRating,
			recipe.recipeStrengthRating
		);
		const { desc2, style } = ratingsMap.find(({ max }) => score <= max) || {
			desc2: 'Best in House',
			style: 'bg-violet-500',
		};
		const desc3 = calculateAbv(
			recipeSteps,
			recipe.recipeTechniqueDescriptionId || 1
		);
		const desc1 = score.toFixed(1);
		return { desc1, desc2, desc3, style };
	};

	const { desc1, desc2, desc3, style } = getScore();

	const getStepDescription = (unit, quantity, category) => {
		const units = getUnits();
		return `Add ${convertFromMl(unit, quantity)} ${units[unit].i18n(quantity)} of ${category}`;
	}

	onMount(async () => {
		const result = await fetch(`/api/generator/recipe`, {
			method: 'POST',
			body: JSON.stringify({ recipeName: recipe.recipeName }),
		});
		const response = await result.json();
		content = response;
	});

	const toggleStep = (index: number) => {
		steps[index].checked = !steps[index].checked;
	};
</script>

<section class="antialiased">
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-rows-[auto_1fr] md:gap-4">
		<!-- col 1 - Image -->
		<div>
			<div class="flex justify-center shrink-0 mx-auto">
				<img
					class="dark:hidden rounded-md"
					src={recipe.recipeImageUrl || placeholderLight}
					alt=""
				/>
				<img
					class="hidden dark:block rounded-md"
					src={recipe.recipeImageUrl || placeholderDark}
					alt=""
				/>
			</div>
		</div>
		<!-- col 2 - Verdict -->
		<div class="lg:col-span-2 col-start-1 md:row-start-2 row-start-5">
			<div class="my-4">
				<h5 class="text-xl font-bold mb-4 inline-block border-b-4 border-primary rounded-sm pb-1">
					Verdict
				</h5>
				<!-- Custom Score Rating -->
				<div class="flex items-start gap-4">
					<span class={cn("w-10 text-sm font-semibold inline-flex items-center justify-center p-1.5 rounded text-white", style)}>
						{desc1}
					</span>
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-2">
							<span class="font-medium">{desc2}</span>
							<span class="text-sm text-muted-foreground">{desc3}</span>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<div class="flex justify-between text-sm mb-1">
									<span>Sweetness</span>
									<span>{recipe.recipeSweetnessRating}/10</span>
								</div>
								<div class="h-2 bg-muted rounded-full overflow-hidden">
									<div class="h-full bg-primary transition-all" style="width: {recipe.recipeSweetnessRating * 10}%"></div>
								</div>
							</div>
							<div>
								<div class="flex justify-between text-sm mb-1">
									<span>Dryness</span>
									<span>{recipe.recipeDrynessRating}/10</span>
								</div>
								<div class="h-2 bg-muted rounded-full overflow-hidden">
									<div class="h-full bg-primary transition-all" style="width: {recipe.recipeDrynessRating * 10}%"></div>
								</div>
							</div>
							<div>
								<div class="flex justify-between text-sm mb-1">
									<span>Strength</span>
									<span>{recipe.recipeStrengthRating}/10</span>
								</div>
								<div class="h-2 bg-muted rounded-full overflow-hidden">
									<div class="h-full bg-primary transition-all" style="width: {recipe.recipeStrengthRating * 10}%"></div>
								</div>
							</div>
							<div>
								<div class="flex justify-between text-sm mb-1">
									<span>Versatility</span>
									<span>{recipe.recipeVersatilityRating}/10</span>
								</div>
								<div class="h-2 bg-muted rounded-full overflow-hidden">
									<div class="h-full bg-primary transition-all" style="width: {recipe.recipeVersatilityRating * 10}%"></div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- col 3 - Description -->
		<div class="col-span-2 md:col-span-1 lg:col-span-2 col-start-1 md:row-start-3 row-start-6">
			<div class="my-4">
				{#if !content}
					<div class="space-y-2">
						<Skeleton class="h-4 w-full" />
						<Skeleton class="h-4 w-3/4" />
					</div>
				{:else}
					<p class="text-muted-foreground">{content.description}</p>
				{/if}
			</div>
		</div>

		<!-- col 4 - Recipe Name & Actions -->
		<div class="col-start-1 md:col-start-2 md:row-start-1">
			<div class="my-4">
				<h1 class="text-3xl font-bold">
					{recipe.recipeName}
				</h1>
				<div class="mt-4 flex flex-wrap items-start gap-4 justify-between">
					<Badge class="text-xl font-semibold">
						{recipe.recipeCategoryDescription}
					</Badge>
				</div>
				<!-- actions -->
				<div class="mt-6 sm:gap-4 sm:items-center sm:flex sm:mt-8">
					{#if permissions.includes('edit_catalog')}
						<a class={cn(buttonVariants({ variant: "outline" }))} href="/catalog/{recipe.recipeId}/edit">
							<Pencil class="w-4 h-4" />
							<span class="ms-2">Edit</span>
						</a>
					{/if}
				</div>
				<p class="my-4 text-muted-foreground">
					{recipe.recipeDescription}
				</p>
			</div>
		</div>
		<!-- col 5 - Steps -->
		<div class="md:row-span-2 col-start-1 md:col-start-2 lg:col-start-3 row-start-4 md:row-start-2 lg:row-start-1">
			<div class="my-4">
				<h5 class="text-xl font-bold mb-4 inline-block border-b-4 border-primary rounded-sm pb-1">
					Steps
				</h5>
				<ul class="rounded-lg border divide-y">
					{#each steps as recipeStep, step}
						<li class="p-3">
							<label class="flex items-center gap-3 cursor-pointer">
								<Checkbox
									checked={steps[step].checked}
									onCheckedChange={() => toggleStep(step)}
								/>
								<span class={recipeStep.checked ? 'line-through text-muted-foreground' : ''}>
									{getStepDescription(recipeStep.productIdQuantityUnit, recipeStep.productIdQuantityInMilliliters, recipeStep.categoryName)}
								</span>
							</label>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</section>
