<script lang="ts">
  import type { BasicRecipe, GeneratedContent, Spirit } from "$lib/types";
  import {
      Heading,
      P,
  } from "flowbite-svelte";
  import CatalogItem from "./CatalogItem.svelte";
  import FancyImage from "./FancyImage.svelte";
  import IconList from "./IconList.svelte";

  // props
  export let spirit: Spirit | null;
  export let recipes: BasicRecipe[] | [];
  export let content: GeneratedContent.Catalog;
  // props

  const handleInput = () => {};
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <!-- col 1 -->
  <div>
    <!-- <Heading tag="h4" class="mb-2">
      {spirit?.recipeCategoryDescription}
    </Heading> -->
    <P color="text-gray-500 dark:text-gray-400" class="mb-2">
      {spirit?.recipeCategoryDescriptionText}
    </P>
    <div class="flex flex-row flex-nowrap justify-center">
      <div class="flex-1">
        <IconList type="success" list={content.goodWith} heading="Good With" />
      </div>

      <div class="flex-1">
        <IconList type="error" list={content.avoidWith} heading="Avoid With" />
      </div>
    </div>
  </div>

  <!-- col 2 -->
  <div class="m-auto">
    <FancyImage
      src={spirit?.recipeCategoryDescriptionImageUrl || ""}
      alt={spirit?.recipeCategoryDescriptionText || ""} />
  </div>
</div>
<div class="mb-6">
  <Heading
    tag="h6"
    customSize="text-md font-semibold"
    class="text-md font-semibold text-gray-900 dark:text-white">
    History
  </Heading>
  <P color="text-gray-500 dark:text-gray-400">
    {content.history}
  </P>
</div>

<Heading tag="h5" class="mb-2">
  Cocktails With {spirit?.recipeCategoryDescription}
</Heading>

  <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
    {#each recipes as recipe}
      <CatalogItem {recipe}/>
    {/each}
  </div>
