<script lang="ts">
  import type { View } from "$lib/types";
  import {
    Button,
    Checkbox,
    Heading,
    P,
    Rating,
    Progressbar,
    Badge,
    ScoreRating,
  } from "flowbite-svelte";
  import { EditOutline, HeartOutline } from "flowbite-svelte-icons";
  import placeholderLight from "$lib/assets/placeholder-alt-light.png";
  import placeholderDark from "$lib/assets/placeholder-alt-dark.png";

  export let recipe: View.BasicRecipe;
  export let recipeSteps: View.BasicRecipeStep[];
  let headerLabel = {
    desc1: '8.7',
    desc2: 'Excellent',
    desc3: '',
    link: {
      label: '',
      url: ''
    }
  };
  // TODO: maybe do this server side?
  const dilutionByShaken = (abv: number) =>
    1.567 * Math.pow(abv, 2) + 1.742 * abv + 0.203;
  const dilutionByStirred = (abv: number) =>
    -1.21 * Math.pow(abv, 2) + 1.246 * abv + 0.145;

  const strength = (() => {
    // in ml
    let volume = recipeSteps.reduce(
      (acc, { productIdQuantityInMilliliters }) =>
        acc + productIdQuantityInMilliliters,
      0,
    );
    let abv = recipeSteps.reduce(
      (acc, { productProof, productIdQuantityInMilliliters }) => {
        acc += (productProof / 2 / 100) * productIdQuantityInMilliliters;
        return acc;
      },
      0,
    );

    if (recipe.recipeTechniqueDescriptionId === 1) {
      volume += dilutionByStirred(abv / 100);
    } else {
      // TODO: we don't have a formula for dry shakes
      volume += dilutionByShaken(abv / 100);
    }
    let total = abv / volume;
    total = (Math.ceil(total * 100) / 100) * 100;
    return total;
  })();
</script>

<!-- <section class="py-8 bg-white md:py-16 dark:bg-gray-900 antialiased"> -->
<section class="bg-white dark:bg-gray-900 antialiased">
  <div class="max-w-screen-xl px-4 mx-auto 2xl:px-0">
<!-- lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16 grid-rows-[auto_1fr] -->
    <!-- grid -->
    <div class="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16 grid-rows-[auto_1fr] h-full">

      <!-- image / col 1 -->
      <div class="shrink-0 max-w-md lg:max-w-md mx-auto">
        <img
          class="w-full dark:hidden rounded-md"
          src={recipe.recipeImageUrl || placeholderLight}
          alt="" />
        <img
          class="w-full hidden dark:block rounded-md"
          src={recipe.recipeImageUrl || placeholderDark}
          alt="" />
      </div>

      <!-- col 2 -->
      <div class="mt-6 sm:mt-8 lg:mt-0 row-span-2">

        <!-- name / info -->
        <Heading>
          {recipe.recipeName}
        </Heading>
        <div class="mt-4">
          <Badge class="text-xl font-semibold">
            {recipe.recipeCategoryDescription}
          </Badge>
        </div>    <div class="mt-4 sm:items-center sm:gap-4 sm:flex">
          <Rating id="example-3" total={5} rating={3.4}>
            <p
              slot="text"
              class="ms-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              3.4 out of 5
            </p>
          </Rating>
        </div>

        <!-- actions -->
        <div class="mt-6 sm:gap-4 sm:items-center sm:flex sm:mt-8">
          <Button color="alternative" href="/catalog/{recipe.recipeId}/edit">
            <EditOutline />
            <span class="ms-2">Edit</span>
          </Button>
          <Button color="primary">
            <HeartOutline />
            <span class="ms-2">Add to favorites</span>
          </Button>
        </div>

        <hr class="my-4 md:my-6 border-gray-200 dark:border-gray-800" />

        <P color="text-gray-500 dark:text-gray-400">
          {recipe.recipeDescription}
        </P>

        <hr class="my-4 md:my-6 border-gray-200 dark:border-gray-800" />

        <div class="my-4">
          <div
            class="flex justify-between mb-1 text-base font-medium text-gray-500 dark:text-gray-400">
            <div>Strength</div>
            <div>
              {strength}%
            </div>
          </div>
          <Progressbar progress={strength} />
        </div>

        <div
          class="mb-1 text-base font-medium text-gray-500 dark:text-gray-400">
          Steps
        </div>
        <ul
          class=" bg-white rounded-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-600">
          {#each recipeSteps as recipeStep}
            <li>
              <Checkbox class="p-3">
                {recipeStep.recipeStepDescription}
              </Checkbox>
            </li>
          {/each}
        </ul>
      </div>

      <div class="mt-6 sm:mt-8 lg:mt-0">

<ScoreRating
  {headerLabel}
  ratings={[
    { label: 'Staff', rating: 8.8 },
    { label: 'Comfort', rating: 8.9 },
    { label: 'Free WiFi', rating: 8.8 },
    { label: 'Facilities', rating: 5.4 }
  ]}
  ratings2={[
    { label: 'Value for money', rating: 8.9 },
    { label: 'Cleanliness', rating: 7.0 },
    { label: 'Location', rating: 8.0 }
  ]} />      </div>

  
    </div>
  </div>
</section>
