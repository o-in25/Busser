<script lang="ts">
  import { Input, Label, Radio } from "flowbite-svelte";
  import FancyButton from "./FancyButton.svelte";
  import { ArrowRightOutline } from "flowbite-svelte-icons";
    import type { Spirit } from "$lib/types";

  // props
  export let spirits: Spirit[];
</script>

<div class="px-4 p-4 mt-3 bg-gray-50 rounded-lg dark:bg-gray-800">
  <form class="relative" method="POST" enctype="multipart/form-data">
    <div class="grid gap-6 mb-6 md:grid-cols-2">
      <div>
        <Label for="productName" class="mb-2">Name</Label>
        <Input
          type="text"
          id="productName"
          name="productName"
          placeholder="Plantation 3 Star"
          required />
      </div>
    </div>

    <Label for="productName" class="mb-2">Category</Label>

    <div class="grid gap-6 w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {#each spirits as spirit}
      <Radio name="custom" custom class="m-auto">
        <div
          class="inline-flex justify-between items-center text-gray-500 bg-white rounded-lg border border-gray-200 cursor-pointer dark:hover:text-gray-300 dark:border-gray-700 dark:peer-checked:text-primary-500 peer-checked:border-primary-600 peer-checked:text-primary-600 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:bg-gray-800 dark:hover:bg-gray-700">
          <div class="block">
            <div class="h-auto w-16 md:w-24 rounded">
              <img
                src="{spirit.recipeCategoryDescriptionImageUrl}"
                class="object-contain rounded" />
            </div>
          </div>
          <div class="w-20 text-center p-0.5">
            <div class="w-full text-sm md:text-md xl:text-lg font-semibold truncate">{spirit.recipeCategoryDescription}</div>
          </div>
        </div>
      </Radio>
      {/each}
    </div>

    <!-- submit -->
    <div class="md:flex md:flex-row">
      <div class="my-4 md:mr-4">
        <FancyButton style="grow md:flex-none" type="submit">Save</FancyButton>
      </div>
    </div>
  </form>
</div>
