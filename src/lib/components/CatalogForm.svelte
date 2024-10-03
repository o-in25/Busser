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
  import type { PreparationMethod, RecipeStep, Spirit } from "$lib/types";
  import FileUpload from "./FileUpload.svelte";
  import CatalogFormItem from "./CatalogFormItem.svelte";
  import { v4 as uuidv4 } from 'uuid';
  import { PlusOutline } from "flowbite-svelte-icons";
  import { applyAction, enhance } from "$app/forms";
    import { goto } from "$app/navigation";

  // props
  export let spirits: Spirit[];
  export let preparationMethods: PreparationMethod[];

  const createStep = () => ({
    recipeStepId: uuidv4(),
    productId: 0,
    productIdQuantityInMilliliters: 0,
    recipeStepDescription: ''
  })

  let steps: RecipeStep[] = [createStep()];

  const addStep = () => {
    steps = [...steps, createStep()]
  };

  function removeStep(stepNumber: number) {
    if(steps.length > 0) {
      steps.splice(stepNumber, 1);
      steps = steps;
    }
  }
</script>

<div class="px-4 p-4 mt-3 bg-gray-50 rounded-lg dark:bg-gray-800">
  <form class="relative" method="POST" enctype="multipart/form-data" use:enhance={({ formData }) => {
    formData.append('recipeSteps', JSON.stringify(steps));
    return async ({ result, update }) => {
			if (result.type === 'redirect') {
				goto(result.location);
			} else {
				await applyAction(result);
			}
    }
  }}>
    <fieldset>
      <legend class="mb-3">
        <Heading tag="h6">Details</Heading>
      </legend>

      <!-- name -->
      <div class="grid gap-6 grid-cols-1 mb-6">
        <div>
          <Label for="productName" class="mb-2">Name</Label>
          <Input
            type="text"
            id="recipeName"
            name="recipeName"
            placeholder="Plantation 3 Star"
            required />
        </div>
      </div>

      <!-- category -->
      <div class="mb-6">
        <Label for="recipeCategoryId" class="mb-2">Category</Label>
        <div
          class="grid gap-6 w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6">
          {#each spirits as spirit}
            <Radio name="recipeCategoryId" custom class="w-full" value={spirit.recipeCategoryId}>
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
        <Label for="RecipeCategoryDescriptionText" class="mb-2">Description</Label>
        <Textarea name="RecipeCategoryDescriptionText" id="RecipeCategoryDescriptionText" rows="4" resizable="false" />
      </div>
      <div class="mb-6">
        <Label for="recipeTechniqueDescriptionId" class="mb-2">Served</Label>
        <ul
          class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600">
          {#each preparationMethods as prepMethod}
            <li class="w-full border-none">
              <Radio name="recipeTechniqueDescriptionId" class="px-3 pt-1" value={prepMethod.recipeTechniqueDescriptionId}>
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
    <fieldset class="px-4">
      <legend class="mb-3">
        <Heading tag="h6">Details</Heading>
      </legend>
      {#each steps as step, stepNumber (step.recipeStepId)}
        <div class="py-4">
          <CatalogFormItem {step} {stepNumber} clickHandler={removeStep} />
        </div>
      {/each}

        <div class="my-4 flex flex-row justify-center">
          <Button class="!p-2" pill={true} on:click={addStep}><PlusOutline class="w-6 h-6"/></Button>
        </div>
    </fieldset>

    <!-- submit -->
    <div class="md:flex md:flex-row">
      <div class="my-4 md:mr-4">
        <FancyButton style="grow md:flex-none" type="submit" on:clicked={event => {
          // event.preventDefault();
          // event.stopImmediatePropagation();
          // console.log(steps)
        }}>Save</FancyButton>
      </div>
    </div>
  </form>
</div>

<style lang="scss">
  textarea {
    resize: none;
  }
</style>
