<script lang="ts">
  import {
    Input,
    Label,
    Radio,
    Textarea,
    Button,
    Hr,
    Heading,
    Helper,
  } from "flowbite-svelte";
  import FancyButton from "./FancyButton.svelte";
  import type { PreparationMethod, Spirit } from "$lib/types";
  import FileUpload from "./FileUpload.svelte";
  import CatalogFormItem from "./CatalogFormItem.svelte";

  // props
  export let spirits: Spirit[];
  export let preparationMethods: PreparationMethod[];
  let steps = [1];
  
  const addStep = () => steps = [...steps, steps[steps.length - 1] + 1];

function onSomeEvent(data){

  steps.splice(data - 1, 1);
  steps = steps;
  console.log(steps)
;
}
</script>

<div class="px-4 p-4 mt-3 bg-gray-50 rounded-lg dark:bg-gray-800">
  <form class="relative" method="POST" enctype="multipart/form-data">
    <fieldset>
      <legend class="mb-6">
        <Heading tag="h6">Recipe Details</Heading>
      </legend>

      <!-- name -->
      <div class="grid gap-6 grid-cols-1 mb-6">
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

      <!-- category -->
      <div class="mb-6">
        <Label for="productName" class="mb-2">Category</Label>
        <div
          class="grid gap-6 w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6">
          {#each spirits as spirit}
            <Radio name="custom" custom class="w-full">
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
      </div>

      <!-- description -->
      <div class="mb-6">
        <Label for="textarea-id" class="mb-2">Description</Label>
        <Textarea id="textarea-id" rows="4" name="message" resizable="false" />
      </div>
      <div class="mb-6">
        <Label for="productName" class="mb-2">Served</Label>
        <ul
          class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600">
          {#each preparationMethods as prepMethod}
            <li class="w-full border-none">
              <Radio name="hor-list" class="px-3 pt-1">
                {prepMethod.recipeTechniqueDescriptionText}
              </Radio>
              <Helper id="helper-checkbox-text" class="ps-9 pb-1">
                Adds {prepMethod.recipeTechniqueDilutionPercentage}% dilution
              </Helper>
            </li>
          {/each}
        </ul>
      </div>

      <!-- image -->
      <div class="mb-6">
        <FileUpload name="productImageUrl" signedUrl={null}></FileUpload>
      </div>
    </fieldset>

    <Hr classHr="my-6" />

    <!-- inner form -->
    <fieldset class="p-4">
      <legend>
        <Heading tag="h6">Recipe Steps</Heading>
      </legend>
      {#each steps as step, index (step)}
        <CatalogFormItem step={index + 1} {onSomeEvent}/>
      {/each}

      <div class="md:flex md:flex-row">
  <div class="my-4 md:mr-4">
    <Button style="grow md:flex-none" on:click={addStep}>Add</Button>
  </div>
</div>

    </fieldset>

    <!-- submit -->
    <div class="md:flex md:flex-row">
      <div class="my-4 md:mr-4">
        <FancyButton style="grow md:flex-none" type="submit">Save</FancyButton>
      </div>
    </div>
  </form>
</div>

<style lang="scss">
  textarea {
    resize: none;
  }
</style>
