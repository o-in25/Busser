<script lang="ts">
  import {
    Card,
    Label,
    Radio,
    Helper,
    ButtonGroup,
    InputAddon,
    Textarea,
    Indicator,
    Button,
    Input,
  } from "flowbite-svelte";
  import Autocomplete from "./Autocomplete.svelte";
  import { MinusOutline } from "flowbite-svelte-icons";
  import type { RecipeStep } from "$lib/types";
    import Heading from "flowbite-svelte/Heading.svelte";
    import { fade, scale } from "svelte/transition";
	import { quintOut } from 'svelte/easing';

  // props
  export let step: RecipeStep;
  export let stepNumber: number;
  export let clickHandler: Function;

  let unit = 'imperial';
  let customChoice = step.productIdQuantityInMilliliters;
  $: customChoice = Number(customChoice) || 0
  let disabled = false;

  let group = step.recipeStepId;

  // $: step.productIdQuantityInMilliliters = Number(customChoice) || 29;


</script>

<div transition:scale={{ duration: 250, delay: 0, opacity: 0.5, start: 0, easing: quintOut }}>
  <Card size="xl" class="relative" >
    <Heading tag="h6">Step {stepNumber + 1}</Heading>
    <!-- <h6>{step}</h6> -->
    {#if stepNumber > 0}
      <button on:click|preventDefault={() => clickHandler(stepNumber)}>
        <Indicator color="red" border size="xl" placement="top-right">
          <span class="text-white text-xs font-bold"><MinusOutline /></span>
        </Indicator>
      </button>
    {/if}
    <div class="mb-6">
      <Autocomplete
        label="Category"
        placeholder="Whiskey"
        fetchUrl="/api/select"
        bind:value={step.productId}
        key="" />
    </div>
    <div class="mb-6">
      <Label class="mb-2">Quantity</Label>
      <ul
        class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600 py-2">
        <li class="w-full border-none">
          <Radio
  
            class="px-3 pt-1"
            value={3}
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
  
            class="px-3 pt-1 text-nowrap"
            value={6}
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
          <Radio  class="px-3 pt-1" bind:group={step.productIdQuantityInMilliliters} value={customChoice} on:click={() => disabled = false}>Custom</Radio>
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
    </div>
    <div class="mb-6">
      <Label for="recipeStepDescription" class="mb-2">Description</Label>
      <Textarea
        rows="4"
        resizable="false"
        bind:value={step.recipeStepDescription} />
    </div>
  </Card>
</div>
