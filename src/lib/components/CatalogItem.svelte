<script lang="ts">
  import type { View } from "$lib/types";
  import {
    Button,
    Checkbox,
    Heading,
    P,
    Rating,
    Secondary,
    Span,
    Card,
    Progressbar,
    Listgroup,
  } from "flowbite-svelte";
  import FancyButton from "./FancyButton.svelte";
  import { EditOutline, HeartOutline } from "flowbite-svelte-icons";
  import {
    AdjustmentsHorizontalSolid,
    DownloadSolid,
    MessagesSolid,
    UserCircleSolid,
  } from "flowbite-svelte-icons";

  export let recipe: View.BasicRecipe;
  export let recipeSteps: View.BasicRecipeStep[];

</script>

<!-- <section class="py-8 bg-white md:py-16 dark:bg-gray-900 antialiased"> -->
<section class="bg-white dark:bg-gray-900 antialiased">
  <div class="max-w-screen-xl px-4 mx-auto 2xl:px-0">
    <div class="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
      <div class="shrink-0 max-w-md lg:max-w-md mx-auto">
        <img
          class="w-full dark:hidden rounded-md"
          src={recipe.recipeImageUrl}
          alt="" />
        <img
          class="w-full hidden dark:block rounded-md"
          src={recipe.recipeImageUrl}
          alt="" />
      </div>

      <div class="mt-6 sm:mt-8 lg:mt-0">
        <Heading>
          {recipe.recipeName}
          <Secondary class="block text-[18px] ms-[3px]">
            {recipe.recipeCategoryDescription} Cocktail
          </Secondary>
        </Heading>

        <div class="mt-4 sm:items-center sm:gap-4 sm:flex">
          <Rating id="example-3" total={5} rating={3.4}>
            <p
              slot="text"
              class="ms-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              3.4 out of 5
            </p>
          </Rating>
        </div>

        <div class="mt-6 sm:gap-4 sm:items-center sm:flex sm:mt-8">
          <Button color="alternative">
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
            class="mb-1 text-base font-medium text-gray-500 dark:text-gray-400">
            Strength
          </div>
          <Progressbar progress="50" color="red" />
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
    </div>
  </div>
</section>
