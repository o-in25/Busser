<script lang="ts">
  import type { View } from "$lib/types";
  import { Button, Heading, P, Rating } from "flowbite-svelte";

  export let recipe: View.BasicRecipe;
  export let recipeSteps: View.BasicRecipeStep[];
</script>

<section class="py-8 bg-white md:py-16 dark:bg-gray-900 antialiased">
  <div class="max-w-screen-xl px-4 mx-auto 2xl:px-0">
    <div class="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
      <div class="shrink-0 max-w-md lg:max-w-lg mx-auto">
        <img
          class="w-full dark:hidden"
          src="https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front.svg"
          alt="" />
        <img
          class="w-full hidden object-contain dark:block"
          src="{recipe.recipeImageUrl}"
          alt="" />
      </div>

      <div class="mt-6 sm:mt-8 lg:mt-0">
        <Heading
          tag="h2"
          customSize="text-xl font-semibold leading-none text-gray-900 md:text-2xl"
          class="mb-2">
          {recipe.recipeName}
        </Heading>

        <div class="mt-4 sm:items-center sm:gap-4 sm:flex">
          <P class="text-2xl font-extrabold">$1,249.99</P>
          <Rating id="example-3" total={5} rating={3.4}>
            <p
              slot="text"
              class="ms-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              3.4 out of 5
            </p>
          </Rating> 
        </div>

        <div class="mt-6 sm:gap-4 sm:items-center sm:flex sm:mt-8">
          <a
            href="#"
            title=""
            class="flex items-center justify-center py-2.5 px-5 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700"
            role="button">
            Add to favorites
          </a>

          <a
            href="#"
            title=""
            class="text-white mt-4 sm:mt-0 bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 dark:bg-primary-600 dark:hover:bg-primary-700 focus:outline-none dark:focus:ring-primary-800 flex items-center justify-center"
            role="button">
            Add to cart
          </a>
        </div>

        <hr class="my-6 md:my-8 border-gray-200 dark:border-gray-800" />

        <P class="mb-6">
          {recipe.recipeDescription}
        </P>

      </div>
    </div>
  </div>
</section>
