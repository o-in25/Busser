<script lang="ts">
  import { Card, Heading, A } from "flowbite-svelte";
  import type { PageData } from "./$types";
    import { ArrowRightOutline } from "flowbite-svelte-icons";

  export let data: PageData;
  const { spirits } = data.args;
</script>

<div class="mt-5 flex items-center justify-between gap-4 md:mb-8">
  <Heading tag="h4" class="mb-4 w-auto">Catalog</Heading>
  <A aClass="font-medium hover:underline flex items-center">
    Browse entire catalog
    <ArrowRightOutline class="ms-1 h-5 w-5"/>
  </A>
</div>
<div class="px-4 py-2 md:py-4">
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {#each spirits as spirit}
        <Card
          img={spirit.recipeCategoryDescriptionImageUrl}
          href="/catalog/{spirit.recipeCategoryId}"
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
