<script lang="ts">
  import {
    Label,
    Input,
    Textarea,
    Helper,
    Button,
    Alert,
  } from "flowbite-svelte";
  import FancyButton from "./FancyButton.svelte";
  import { InfoCircleSolid } from "flowbite-svelte-icons";
import type { QueryResult } from "$lib/types";
    import { enhance } from "$app/forms";
  let error = false;
  export let result: QueryResult;


</script>

<div class="px-4 p-4 mt-3 bg-gray-50 rounded-lg dark:bg-gray-800">
  <form class="grid gap-6 mb-6" method="POST" use:enhance>
    <div>
      <Label for="categoryName" color={error ? "red" : "gray"} class="block mb-2">
        Name
      </Label>
      <Input
        id="categoryName"
        name="categoryName"
        color={error ? "red" : "base"}
      />
      <!-- <Helper class={error ? "mt-2" : "hidden"} color={error ? "red" : "gray"}>
        <span class="font-medium">Well done!</span>
        Some success message.
      </Helper> -->
    </div>
    <div>
      <Label for="categoryDescription" class="mb-2">Description</Label>
      <Textarea
        id="categoryDescription"
        name="categoryDescription"
        rows="4" />
    </div>

    <!-- submit -->
    <div class="md:flex md:flex-row">
      <div class="my-4 md:mr-4">
        <FancyButton style="grow md:flex-none" type="submit">Save</FancyButton>
      </div>
      <!-- <div class="my-4">
        <FancyButton
          style="grow md:flex-none"
          type="button"
          color="orangeToRed"
          on:clicked={openModal}>
          Delete
        </FancyButton>
      </div> -->
      {#if result?.status === 'success' || result?.status === 'error'}
        <div class="my-4 md:ml-4">
          <div class="md:w-96 md:m-auto">
            <Alert border color={'error' in result ? "red" : "green"}>
              <InfoCircleSolid slot="icon" class="w-5 h-5" />
              {#if 'error' in result}<span class="font-medium">
                  {result.error}
                </span>{:else}Category added to inventory.{/if}
            </Alert>
          </div>
        </div>
      {/if}
    </div>
  </form>
</div>
