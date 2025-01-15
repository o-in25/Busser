<script lang="ts">
  import type { Spirit } from "$lib/types";
  import { Label, Radio } from "flowbite-svelte";
  import { onMount } from "svelte";
  
  export let selected: string | number = 4;

  let spirits: Spirit[] = [];

  onMount(async () => {
    const result = await fetch('/api/select/spirits')
    const data = await result.json();
    spirits = data;
  })

</script>
<Label for="recipeCategoryId" class="mb-2">Category</Label>
<div
  class="grid gap-6 w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6">
  {#each spirits as spirit}
    <Radio
      name="recipeCategoryId"
      custom
      class="w-full"
      value={spirit.recipeCategoryId}
      bind:group={selected}
      >
      <div
        class="inline-flex justify-between items-center text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-primary-500 peer-checked:border-primary-600 peer-checked:text-primary-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
        <div class="block">
          <div class="h-auto max-w-16 md:max-w-20 rounded">
            <img
              src={spirit.recipeCategoryDescriptionImageUrl}
              alt={spirit.recipeCategoryDescription}
              class="object-contain rounded" />
          </div>
        </div>
        <div class="w-20 text-center p-0.5">
          <div class="w-full text-sm md:text-md font-semibold truncate">
            {spirit.recipeCategoryDescription}
          </div>
        </div>
      </div>
    </Radio>
  {/each}
</div>