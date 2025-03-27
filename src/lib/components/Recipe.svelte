<script lang="ts">
	import type {View} from '$lib/types';
	import {
		Button,
		Checkbox,
		Heading,
		P,
		Rating,
		Progressbar,
		Badge,
		ScoreRating,
		Accordion,
		AccordionItem,
	} from 'flowbite-svelte';
	import {EditOutline, HeartOutline} from 'flowbite-svelte-icons';
	import placeholderLight from '$lib/assets/placeholder-alt-light.png';
	import placeholderDark from '$lib/assets/placeholder-alt-dark.png';
	import { calculateOverallScore, dilutionByShaken, dilutionByStirred } from '$lib/math';

	export let recipe: View.BasicRecipe;
	export let recipeSteps: View.BasicRecipeStep[];

  let steps = recipeSteps.map(step => ({ ...step, checked: false }));


	const calculateAbv = () => {
		// in ml
		let volume = recipeSteps.reduce(
			(acc, {productIdQuantityInMilliliters}) =>
				acc + productIdQuantityInMilliliters,
			0
		);
		let abv = recipeSteps.reduce(
			(acc, {productProof, productIdQuantityInMilliliters}) => {
				acc += (productProof / 2 / 100) * productIdQuantityInMilliliters;
				return acc;
			},
			0
		);

		if (recipe.recipeTechniqueDescriptionId === 1) {
			volume += dilutionByStirred(abv / 100);
		} else {
			// TODO: we don't have a formula for dry shakes
			volume += dilutionByShaken(abv / 100);
		}
		let total = abv / volume;
		total = (Math.ceil(total * 100) / 100) * 100;
		return `${total}% abv`;
	};


  const getScore = () => {
    const ratingsMap = [
      { max: 0, desc2: "No Rating", style: "text-white dark:bg-gray-500 bg-gray-500" },
      { max: 1, desc2: "Swill", style: "text-white dark:bg-red-500 bg-red-500" },
      { max: 2, desc2: "Forgettable", style: "text-white dark:bg-red-500 bg-red-500" },
      { max: 3, desc2: "Bottom Shelf", style: "text-white dark:bg-red-500 bg-red-500" },
      { max: 4, desc2: "Decent", style: "text-white dark:bg-yellow-500 bg-yellow-500" },
      { max: 5, desc2: "Standard Pour", style: "text-white dark:bg-yellow-500 bg-yellow-500" },
      { max: 6, desc2: "Good Stuff", style: "text-white dark:bg-green-500 bg-green-500" },
      { max: 7, desc2: "Top Shelf", style: "text-white dark:bg-green-500 bg-green-500" },
      { max: 8, desc2: "Connoisseur's Choice", style: "text-white dark:bg-green-500 bg-green-500" },
      { max: 9, desc2: "Bartender's Favorite", style: "text-white dark:bg-blue-500 bg-blue-500" },
    ];

    // i hate these names
    const score = calculateOverallScore(recipe.recipeVersatilityRating, recipe.recipeSweetnessRating, recipe.recipeDrynessRating, recipe.recipeStrengthRating)
    const { desc2, style } = ratingsMap.find(({ max }) => score <= max) || { desc2: "Best in House", style: "text-white dark:bg-violet-500 bg-violet-500" };
    const desc3 = calculateAbv();
    const desc1 = score.toFixed(1)
    return {
      desc1, desc2, desc3,
      style
    };
  };

  const { desc1, desc2, desc3, style} = getScore();


</script>

<!-- <section class="py-8 bg-white md:py-16 dark:bg-gray-900 antialiased"> -->
<section class="bg-white dark:bg-gray-900 antialiased">
	<div class="max-w-screen-xl px-4 mx-auto 2xl:px-0">
		<!-- lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16 grid-rows-[auto_1fr] -->
		<!-- grid -->
		<div
			class="lg:grid lg:grid-cols-2 lg:gap-4 xl:gap-8 grid-rows-[auto_1fr] h-full">
			<!-- image / col 1 -->
			<div class="flex justify-center lg:justify-start shrink-0 max-w-md lg:max-w-md mx-auto">
				<img
					class="w-1/2 dark:hidden rounded-md"
					src={recipe.recipeImageUrl || placeholderLight}
					alt="" />
				<img
					class="w-1/2 hidden dark:block rounded-md"
					src={recipe.recipeImageUrl || placeholderDark}
					alt="" />
			</div>

			<!-- col 2 -->
			<div class="mt-6 sm:mt-8 lg:mt-0 row-span-2">
				<!-- name / info -->
				<Heading>
					{recipe.recipeName}
				</Heading>
				<div class="mt-4 flex flex-wrap items-start gap-4 justify-between">
					<Badge class="text-xl font-semibold">
						{recipe.recipeCategoryDescription}
					</Badge>
				</div>

        <!-- rating -->
				<div class="mt-4">
					<ScoreRating
						headerLabel={{
							desc1,
							desc2,
							desc3,
							link: {
								label: '',
								url: '',
							},
						}}
						ratings={[
							{ label: 'Sweetness', rating: recipe.recipeSweetnessRating },
							{ label: 'Dryness', rating: recipe.recipeDrynessRating },
						]}
						ratings2={[
							{ label: 'Strength', rating: recipe.recipeStrengthRating },
							{ label: 'Versatility', rating: recipe.recipeVersatilityRating },
						]}
            desc1Class="w-8 text-sm font-semibold inline-flex items-center p-1.5 rounded {style}"/>
				</div>

				<!-- actions -->
				<div class="mt-6 sm:gap-4 sm:items-center sm:flex sm:mt-8">
					<Button
						color="alternative"
						href="/catalog/{recipe.recipeId}/edit">
						<EditOutline />
						<span class="ms-2">Edit</span>
					</Button>
					<Button color="primary">
						<HeartOutline />
						<span class="ms-2">Add to favorites</span>
					</Button>
				</div>

				<!-- <P color="text-gray-500 dark:text-gray-400">
					{recipe.recipeDescription}
				</P> -->
			</div>

			<div class="mt-6 sm:mt-8 lg:mt-0">

        
      </div>
		</div>
    <Accordion flush>
      <AccordionItem>
        <span slot="header">Description</span>
        <p class="mb-2 text-gray-500 dark:text-gray-400">{recipe.recipeDescription}</p>
      </AccordionItem>
      <AccordionItem>
        <span slot="header">Steps</span>
        <ul
        class=" bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600">
        {#each steps as recipeStep, step}
          <li>
            <Checkbox class="p-3" bind:checked={steps[step].checked}>
              <span class={recipeStep.checked ? "line-through" : ""}>
                {recipeStep.recipeStepDescription}
              </span>
            </Checkbox>
          </li>
        {/each}
      </ul>

      </AccordionItem>
    </Accordion>
	</div>
</section>
