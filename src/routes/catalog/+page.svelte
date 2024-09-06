<script lang="ts">
  import { Card, Heading } from "flowbite-svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
  const { spirits } = data.args;
</script>

<div class="mt-5">
  <Heading tag="h4" class="mb-4 flex flex-row justify-between">Catalog</Heading>
</div>
<div class="px-4 py-2 md:py-4">
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {#each spirits as spirit}
        <Card
          img={spirit.recipeCategoryDescriptionImageUrl}
          href="/"
          horizontal
          size="xl">
          <h5
            class="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {spirit.recipeCategoryDescription}
          </h5>
          <p
            class="mb-3 font-normal text-gray-700 dark:text-gray-400 leading-tight">
            {spirit.recipeCategoryDescriptionText}
          </p>
        </Card>
      {/each}
    </div>
  </div>
</div>
