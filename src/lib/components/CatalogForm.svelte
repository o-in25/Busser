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
		Modal,
		Span,
		P,
    Range
  } from "flowbite-svelte";
  import type {
    ComponentAction,
    PreparationMethod,
    Spirit,
    View,
  } from "$lib/types";
  import FileUpload from "./FileUpload.svelte";
  import CatalogFormItem from "./CatalogFormItem.svelte";
  import { v4 as uuidv4 } from "uuid";
  import { PlusOutline } from "flowbite-svelte-icons";
  import { applyAction, enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { RadioButton, ButtonGroup } from "flowbite-svelte";
  import { quintOut } from "svelte/easing";
  import { scale } from "svelte/transition";
  import { notificationStore } from "../../stores";


  // const ML_TO_OZ = 29.5735

  // props
  export let spirits: Spirit[];
  export let preparationMethods: PreparationMethod[];
  export let recipe: View.BasicRecipe = {} as View.BasicRecipe;
  export let recipeSteps: View.BasicRecipeStep[] = [];

  const units = {
    'ml': { toMl: 1, fromMl: (ml) => ml },
    'oz': { toMl: 30, fromMl: (ml: number) => ml / 30 },
    'dash': { toMl: 0.92, fromMl: (ml: number) => ml / 0.92 },
    'cube': { toMl: 2.5, fromMl: (ml: number) => ml / 2.5 },
  };

  const convertToMl = (unit: string, value: number) => value * units[unit].toMl;
  const convertFromMl = (unit: string, value: number) => units[unit].fromMl(value);

  // recipe model
  recipeSteps = recipeSteps.map((step) => ({ ...step, productIdQuantityInMilliliters: convertFromMl(step.productIdQuantityUnit, step.productIdQuantityInMilliliters), key: uuidv4() }));
  const createStep = () => ({
    recipeId: recipe.recipeId || 0,
    recipeStepId: 0,
    productId: 0,
    recipeStepDescription: null,
    productName: "",
    categoryName: "",
    categoryDescription: null,
    supplierName: "",
    supplierDetails: null,
    productIdQuantityInMilliliters: 0,
    productIdQuantityUnit: 'ml', //  ONLY right here can we pull in a user preference for the default value
    productInStockQuantity: 0,
    productPricePerUnit: 0,
    productUnitSizeInMilliliters: 0,
    productProof: 0,
    key: uuidv4(),
  });

  let steps = recipeSteps.length ? recipeSteps : [createStep()];


  const addStep = () => {
    steps = [...steps, createStep()];
  };

  const removeStep = (stepNumber: number) => {
    if (steps.length > 0) {
      steps.splice(stepNumber, 1);
      steps = steps;
    }
  };

  // const getRecipeSteps = () => {
  //   const recipeSteps = steps.map((step: View.BasicRecipeStep) => ({ ...step, productUnitSizeInMilliliters: convertToMl(step.productIdQuantityUnit, step.productUnitSizeInMilliliters)}))
  // }

  const deleteRecipe = async() => {
    const response = await fetch(`/api/catalog/${recipe.recipeId}`, {
      method: 'DELETE'
    });


    const result = await response.json();
    if('data' in result) {
      $notificationStore.success = { message: 'Catalog item deleted.'}
      // goto(`/inventory`);
    } else {
      $notificationStore.error = { message: result.error }
    }

  }

  // form props
  let [defaultPrepMethodChoice] = preparationMethods;
  let [defaultSpirit] = spirits;
  let defaultSpiritChoice =
    recipe.recipeCategoryId || defaultSpirit.recipeCategoryId;
  let prepMethodChoice =
    recipe.recipeTechniqueDescriptionId ||
    defaultPrepMethodChoice.recipeTechniqueDescriptionId;

  $: prepMethodDilutionPct =
    defaultPrepMethodChoice.recipeTechniqueDilutionPercentage;

  let disabled = false;
  let modalOpen = false;
  
</script>

<div class="px-4 p-4 mt-3 bg-gray-50 rounded-lg dark:bg-gray-800">
  <form
    class="relative"
    method="POST"
    enctype="multipart/form-data"
    on:submit
    use:enhance={({ formData }) => {
      disabled = true;
      let json = steps.map((step) => ({ ...step, productIdQuantityInMilliliters: convertToMl(step.productIdQuantityUnit, step.productIdQuantityInMilliliters)}));

      console.log(json)
      formData.append("recipeSteps", JSON.stringify(json));
      return async ({ result }) => {
        if (result.type === "redirect") {
          goto(result.location);
        } else {
          await applyAction(result);
          disabled = false;
          if (result.type === "failure")
            $notificationStore.error = {
              message: result?.data?.error?.toString() || "",
            };
          if (result.type === "success")
            $notificationStore.success = { message: "Catalog updated." };
        }
      };
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
            bind:value={recipe.recipeName}
            required />
        </div>
      </div>

      <!-- category -->
      <div class="mb-6">
        <Label for="recipeCategoryId" class="mb-2">Category</Label>
        <div
          class="grid gap-6 w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6">
          {#each spirits as spirit}
            <Radio
              name="recipeCategoryId"
              custom
              class="w-full"
              value={spirit.recipeCategoryId}
              bind:group={defaultSpiritChoice}>
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
        <Label for="recipeDescription" class="mb-2">Description</Label>
        <Textarea
          name="recipeDescription"
          id="recipeDescription"
          rows={4}
          bind:value={recipe.recipeDescription} />
      </div>

      <!-- served -->
      <div class="mb-6">
        <Label for="recipeTechniqueDescriptionId" class="mb-2">Served</Label>
        <ButtonGroup
          class="grid grid-flow-col justify-items-stretch rounded-sm shadow-sm">
          {#each preparationMethods as prepMethod}
            <RadioButton
              size="md"
              value={prepMethod.recipeTechniqueDescriptionId}
              name="recipeTechniqueDescriptionId"
              on:click={() =>
                (prepMethodDilutionPct =
                  prepMethod.recipeTechniqueDilutionPercentage)}
              bind:group={prepMethodChoice}>
              <span class="w-">
                {prepMethod.recipeTechniqueDescriptionText}
              </span>
            </RadioButton>
          {/each}
        </ButtonGroup>
        <Helper id="helper-checkbox-text" class="ps-1 py-1">
          Adds {prepMethodDilutionPct}% dilution by water.
        </Helper>
      </div>

      <!-- image -->
      <div class="mb-6">
        <FileUpload
          name="recipeImageUrl"
          signedUrl={recipe.recipeImageUrl || null}></FileUpload>
      </div>
    </fieldset>

    <!-- rating -->
    <fieldset>
      <Label for="productName" class="mb-2">Ratings</Label>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="mt-4">
          <Label for="recipeSweetnessRating" class="mb-2">Sweetness</Label>
          <Range id="recipeSweetnessRating" name="recipeSweetnessRating" size="lg" bind:value={recipe.recipeSweetnessRating} min="0" max="10" step="0.1"/>
        </div>
        <div class="mt-4">
          <Label for="recipeDrynessRating" class="mb-2">Dryness</Label>
          <Range id="recipeDrynessRating" name="recipeDrynessRating" size="lg" bind:value={recipe.recipeDrynessRating} min="0" max="10" step="0.1" />
        </div>
        <div class="mt-4">
          <Label for="recipeVersatilityRating" class="mb-2">Versatility</Label>
          <Range id="recipeVersatilityRating" name="recipeVersatilityRating" size="lg" bind:value={recipe.recipeVersatilityRating} min="0" max="10" step="0.1"/>
        </div>
        <div class="mt-4">
          <Label for="recipeStrengthRating" class="mb-2">Strength</Label>
          <Range id="recipeStrengthRating" name="recipeStrengthRating" size="lg" bind:value={recipe.recipeStrengthRating} min="0" max="10" step="0.1" />
        </div>
      </div>
    </fieldset>

    <Hr classHr="my-4" />

    <!-- inner form -->
    <fieldset class="px-1 md:py-2">
      <legend class="mb-2">
        <Heading tag="h6">Steps</Heading>
      </legend>
      {#each steps as step, stepNumber (step.key)}
        <div
          class="py-4"
          transition:scale={{
            duration: 250,
            delay: 0,
            opacity: 0.5,
            start: 0,
            easing: quintOut,
          }}>
          <CatalogFormItem {step} {stepNumber} clickHandler={removeStep} />
        </div>
      {/each}

      <div class="my-4 flex flex-row justify-center">
        <Button
          class="!p-2"
          pill={true}
          on:click={addStep}
          color="primary"
          outline>
          <PlusOutline class="w-6 h-6" />
          <span class="hidden lg:block pe-2">Add Another Step</span>
        </Button>
      </div>
    </fieldset>

    <!-- submit -->
    <div class="md:flex md:flex-row-reverse">
      <div class="my-4 md:mr-4">
        {#if recipe.recipeId}
          <Button
            class="w-full md:w-32"
            type="button"
            size="xl"
            color="red"
            on:click={() => modalOpen = true}>
            Delete
          </Button>
        {/if}
      </div>
      <!-- delete -->
      <div class="my-4 md:mr-4">
        <Button class="w-full md:w-32" type="submit" size="xl" {disabled}>
          Save
        </Button>
        </div>
      </div>
  </form>
    {#if recipe.recipeId}
      <Modal title="Confirm Delete" bind:open={modalOpen} autoclose>
        <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
          Delete&nbsp;<Span>{recipe?.recipeName}</Span>&nbsp;from catalog?
          <P color="text-red-700 dark:text-red-500" weight="bold">Once deleted, it can't be recovered.</P>
        </p>
        <svelte:fragment slot="footer">
          <Button color="red" on:click={async () => {
            await deleteRecipe();
          }}>Delete</Button>
          <Button color="alternative">Cancel</Button>
        </svelte:fragment>
      </Modal>
    {/if}
</div>

<style lang="scss">
  textarea {
    resize: none;
  }
</style>
