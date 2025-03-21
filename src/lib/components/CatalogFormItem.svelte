<script lang="ts">
  import {
    Card,
    Label,
    Textarea,
    Indicator,
    Input,
  } from "flowbite-svelte";
  import Autocomplete from "./Autocomplete.svelte";
  import { MinusOutline } from "flowbite-svelte-icons";
  import type { View } from "$lib/types";
  import Heading from "flowbite-svelte/Heading.svelte";

  // props
  export let step: View.BasicRecipeStep;
  export let stepNumber: number;
  export let clickHandler: Function;

  const selectClass = 'shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-500 bg-gray-100 border border-gray-300 rounded-e-lg hover:bg-gray-200 focus:ring-4 focus:outline-hidden focus:ring-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 dark:text-white dark:border-gray-600'

  // let customChoice = step.productIdQuantityInMilliliters;
  // $: customChoice = Number(customChoice)
  // let testClss = ''//'border-solid border-2 !border-green-500'



  /*

  heres the problem.

  currently everything is stored in ml. we want that, so it can be our canonical unit

  so if the 
  
  */


  const handleChange = () => {

  }

</script>

  <Card size="xl" class="relative mx-auto">
    <Heading tag="h6">Step {stepNumber + 1}</Heading>
    <!-- <h6>{step}</h6> -->
    {#if stepNumber > 0}
      <button on:click|preventDefault={() => clickHandler(stepNumber)}>
        <Indicator color="red" border size="xl" placement="top-right">
          <span class="text-white text-xs font-bold"><MinusOutline /></span>
        </Indicator>
      </button>
    {/if}

    <!-- product name -->
    <div class="mb-6">
      <Autocomplete
        label="Category"
        placeholder="Whiskey"
        name="productId"
        fetchUrl="/api/select/products"
        bind:value={step.productId}
        key="{step.productName}" />
    </div>

    <!-- quantity -->
    <!-- <div class="mb-6">
      <Label class="mb-2">Quantity</Label>
      <ul
        class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600 py-2">
        <li class="w-full border-none">
          <Radio

            name="productIdQuantityInMilliliters"
            class="px-3 pt-1"
            value={0.86}
            bind:group={step.productIdQuantityInMilliliters}
            on:click={() => disabled = true}
            >
            Dash
          </Radio>
          <Helper id="helper-checkbox-text" class="ps-9 pb-1">
            About
            {#if unit === "imperial"}
              <span class="diagonal-fractions">1/32</span>
              &nbsp;oz.
            {:else}
              0.9 mL
            {/if}
          </Helper>
        </li>
        <li class="w-full border-none">
          <Radio
            name="productIdQuantityInMilliliters"
            class="px-3 pt-1 text-nowrap"
            value={1.77}
            bind:group={step.productIdQuantityInMilliliters}
            on:click={() => disabled = true}
          >
            Bar Spoon
          </Radio>
          <Helper id="helper-checkbox-text" class="ps-9 pb-1">
            About
            {#if unit === "imperial"}
              <span class="diagonal-fractions">1/6</span>
              &nbsp;oz.
            {:else}
              5 mL
            {/if}
          </Helper>
        </li>
        <li class="w-full border-none">
          <Radio name="productIdQuantityInMilliliters" class="px-3 pt-1" bind:group={step.productIdQuantityInMilliliters} value={customChoice} on:click={() => disabled = false}>Custom</Radio>
        </li>
        <li class="w-full border-none p-3">
          <div>
            <ButtonGroup class="w-full">
              <Input
                bind:value={customChoice}
                on:change={() => step.productIdQuantityInMilliliters = customChoice}
                {disabled}
               />
  
              <InputAddon>
                <button
                  on:click|preventDefault={() =>
                    (unit = unit === "imperial" ? "metric" : "imperial")}
                  class="w-4"
                >
                  <span >
                    {#if unit === "imperial"}oz{:else}mL{/if}
                  </span>
                </button>
              </InputAddon>
            </ButtonGroup>
          </div>
        </li>
      </ul>
    </div> -->

    <div class="mb-6">
      <Label for="recipeStepDescription" class="mb-2">Amount</Label>
      <div class="flex">
        <Input placeholder="Choose the state" class="!rounded-e-none" bind:value={step.productIdQuantityInMilliliters}/>
        <select class={selectClass} bind:value={step.productIdQuantityUnit}>
          {#each ['oz', 'ml', 'dash', 'drop', 'cube'] as unit} 
            <option selected>{unit}</option>
          {/each}
        </select>
        <!-- <Dropdown triggeredBy="#states-button">
          <DropdownItem class="flex items-center" selected>
            oz
          </DropdownItem>
          <DropdownItem class="flex items-center">
            ml
          </DropdownItem>
          <DropdownItem class="flex items-center">
            Dashes
          </DropdownItem>
          <DropdownItem class="flex items-center">
            Drops
          </DropdownItem>
          <DropdownItem class="flex items-center">
            Drops
          </DropdownItem>
        </Dropdown> -->
      </div>
    </div>
    <!-- description -->
    <div class="mb-6">
      <Label for="recipeStepDescription" class="mb-2">Description</Label>
      <Textarea
        rows="4"
        resizable="false"
        bind:value={step.recipeStepDescription} />
    </div>
  </Card>
