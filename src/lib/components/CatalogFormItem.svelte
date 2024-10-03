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

  // props
  export let step: RecipeStep;
  export let onSomeEvent;

  let unit = 'imperial';
  let customChoice = '';
  $: customChoice = customChoice
  let disabled = false;

  // $: step.productIdQuantityInMilliliters = Number(customChoice) || 29;


</script>

<Card size="xl" class="relative">
  <!-- <h6>{step}</h6> -->
  <button on:click|preventDefault={() => onSomeEvent(step)}>
    <Indicator color="red" border size="xl" placement="top-right">
      <span class="text-white text-xs font-bold"><MinusOutline /></span>
    </Indicator>
  </button>
  <div class="mb-6">
    <Autocomplete
      label="Category"
      placeholder="Whiskey"
      fetchUrl="/api/select"
      name="categoryId"
      bind:value={step.productId}
      key="" />
  </div>
  <div class="mb-6">
    <Label for="first_name" class="mb-2">Quantity</Label>

    <ul
      class="items-center w-full rounded-lg border border-gray-200 sm:flex dark:bg-gray-800 dark:border-gray-600 divide-x rtl:divide-x-reverse divide-gray-200 dark:divide-gray-600 py-2">
      <li class="w-full border-none">
        <Radio
          name="quantity"
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
          name="quantity"
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
        <Radio name="quantity" class="px-3 pt-1" bind:group={step.productIdQuantityInMilliliters} value={customChoice} on:click={() => disabled = false}>Custom</Radio>
      </li>
      <li class="w-full border-none p-3">
        <div>
          <ButtonGroup class="w-full">
            <Input
              name="quantity"
              bind:value={customChoice}
              on:change={() => step.productIdQuantityInMilliliters = customChoice}
              {disabled}
             />

            <InputAddon>
              <button
                on:click|preventDefault={() =>
                  (unit = unit === "imperial" ? "metric" : "imperial")}
                class="w-4"
                {disabled}
              >
                <span class="">
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
    <Label for="first_name" class="mb-2">Description</Label>
    <Textarea
      id="textarea-id"
      rows="4"
      name="message"
      resizable="false"
      bind:value={step.recipeStepDescription} />
  </div>
</Card>
