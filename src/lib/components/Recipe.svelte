<script lang="ts">
	import type { View } from '$lib/types';
	import {
		Button,
		Checkbox,
		Heading,
		P,
		Badge,
		ScoreRating,
		Accordion,
		AccordionItem,
		Skeleton,
		Label,
	} from 'flowbite-svelte';
	import { EditOutline, HeartOutline } from 'flowbite-svelte-icons';
	import placeholderLight from '$lib/assets/placeholder-alt-light.png';
	import placeholderDark from '$lib/assets/placeholder-alt-dark.png';
	import { calculateAbv, calculateOverallScore } from '$lib/math';
	import type { RecipeGeneratorSchema } from '$lib/server/generators/recipe-generator';
	import { onMount } from 'svelte';

	export let recipe: View.BasicRecipe;
	export let recipeSteps: View.BasicRecipeStep[];
	let content: RecipeGeneratorSchema;

	let steps = recipeSteps.map(step => ({ ...step, checked: false }));
	// TODO: move this to shared component

	const getScore = () => {
		const ratingsMap = [
			{
				max: 0,
				desc2: 'No Rating',
				style: 'text-white dark:bg-gray-500 bg-gray-500',
			},
			{
				max: 1,
				desc2: 'Swill',
				style: 'text-white dark:bg-red-500 bg-red-500',
			},
			{
				max: 2,
				desc2: 'Forgettable',
				style: 'text-white dark:bg-red-500 bg-red-500',
			},
			{
				max: 3,
				desc2: 'Bottom Shelf',
				style: 'text-white dark:bg-red-500 bg-red-500',
			},
			{
				max: 4,
				desc2: 'Decent',
				style: 'text-white dark:bg-yellow-500 bg-yellow-500',
			},
			{
				max: 5,
				desc2: 'Standard Pour',
				style: 'text-white dark:bg-yellow-500 bg-yellow-500',
			},
			{
				max: 6,
				desc2: 'Good Stuff',
				style: 'text-white dark:bg-green-500 bg-green-500',
			},
			{
				max: 7,
				desc2: 'Top Shelf',
				style: 'text-white dark:bg-green-500 bg-green-500',
			},
			{
				max: 8,
				desc2: "Connoisseur's Choice",
				style: 'text-white dark:bg-green-500 bg-green-500',
			},
			{
				max: 9,
				desc2: "Bartender's Favorite",
				style: 'text-white dark:bg-blue-500 bg-blue-500',
			},
		];
		// i hate these names
		const score = calculateOverallScore(
			recipe.recipeVersatilityRating,
			recipe.recipeSweetnessRating,
			recipe.recipeDrynessRating,
			recipe.recipeStrengthRating
		);
		const { desc2, style } = ratingsMap.find(({ max }) => score <= max) || {
			desc2: 'Best in House',
			style: 'text-white dark:bg-violet-500 bg-violet-500',
		};
		const desc3 = calculateAbv(
			recipeSteps,
			recipe.recipeTechniqueDescriptionId || 1
		);
		const desc1 = score.toFixed(1);
		return {
			desc1,
			desc2,
			desc3,
			style,
		};
	};

	const { desc1, desc2, desc3, style } = getScore();

	// fetch generated content on load
	onMount(async () => {
		const result = await fetch(`/api/generator/recipe`, {
			method: 'POST',
			body: JSON.stringify({ recipeName: recipe.recipeName }),
		});
		const response = await result.json();
		content = response;
	});
</script>

<section class="bg-white dark:bg-gray-900 antialiased">
	<!-- grid -->
	<div
		class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 grid-rows-[auto_1fr] md:gap-4 text-white"
	>
		<!-- col 1 -->
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
		<!-- col 2 -->
		<div class="lg:col-span-2 col-start-1 md:row-start-2 row-start-5">
			<div class="my-4">
        <Heading tag="h5" class="mb-4 block md:inline-block border-b-4 border-secondary-500 rounded-sm pb-1 md:!w-auto">Verdict</Heading>

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
          desc1Class="w-8 text-sm font-semibold inline-flex items-center p-1.5 rounded {style}"
          desc2Class="ms-2 w-24 font-medium text-gray-900 dark:text-white me-2"
        />
      </div>
		</div>
		<!-- col 3 -->
		<div class="col-span-2 md:col-span-1 lg:col-span-2 col-start-1 md:row-start-3 row-start-6">
			<div class="my-4">
        {#if !content}
          <Skeleton
            size="sm"
            divClass="!max-w-full"
          />
        {:else}
          <P>{content.description}</P>
        {/if}
      </div>
		</div>
		<!-- col 4 -->
		<!-- col 5 -->

		<div
			class="col-start-1 md:col-start-2 md:row-start-1"
		>
			<div class="my-4">
        <Heading>
          {recipe.recipeName}
        </Heading>
        <div class="mt-4 flex flex-wrap items-start gap-4 justify-between">
          <Badge class="text-xl font-semibold">
            {recipe.recipeCategoryDescription}
          </Badge>
        </div>
        <!-- actions -->
        <div class="mt-6 sm:gap-4 sm:items-center sm:flex sm:mt-8">
          <Button
            color="alternative"
            href="/catalog/{recipe.recipeId}/edit"
          >
            <EditOutline />
            <span class="ms-2">Edit</span>
          </Button>
          <Button color="primary">
            <HeartOutline />
            <span class="ms-2">Add to favorites</span>
          </Button>
        </div>
        <p class="my-4 text-gray-500 dark:text-gray-400">
          {recipe.recipeDescription}
        </p>
      </div>
		</div>
		<!-- col 6 -->
		<div
			class="md:row-span-2 col-start-1 md:col-start-2 lg:col-start-3 row-start-4 md:row-start-2 lg:row-start-1"
		>
			<div class="my-4 ">
        <Heading tag="h5" class="mb-4 block md:inline-block border-b-4 border-secondary-500 rounded-sm pb-1 md:!w-auto">Steps</Heading>
        <ul
          class=" bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600"
        >
          {#each steps as recipeStep, step}
            <li>
              <Checkbox
                class="p-3"
                bind:checked={steps[step].checked}
              >
                <span class={recipeStep.checked ? 'line-through' : ''}>
                  {recipeStep.recipeStepDescription}
                </span>
              </Checkbox>
            </li>
          {/each}
        </ul>
      </div>
		</div>
	</div>
</section>
