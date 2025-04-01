<script lang="ts">
  import {
    Label,
    Input,
    Textarea,
    Alert,
		Button,
  } from "flowbite-svelte";
  import FancyButton from "./FancyButton.svelte";
  import { InfoCircleSolid } from "flowbite-svelte-icons";
  import type { FormSubmitResult, QueryResult } from "$lib/types";
  import { enhance } from "$app/forms";
  let error = false;
  export let result: FormSubmitResult = {};
</script>

<div class="px-4 p-4 mt-3 bg-gray-50 rounded-lg dark:bg-gray-800">
  <form class="grid gap-6 mb-6" method="POST" use:enhance>
    <div>
      <Label
        for="categoryName"
        color={result.error ? "red" : "gray"}
        class="block mb-2">
        Name
      </Label>
      <Input
        id="categoryName"
        name="categoryName"
        color={result.error ? "red" : "base"} />
    </div>
    <div>
      <Label for="categoryDescription" class="mb-2">Description</Label>
      <Textarea id="categoryDescription" name="categoryDescription" rows={4} />
    </div>

    <!-- submit -->
    <div class="md:flex md:flex-row">
      <div class="my-4 md:mr-4">
        <Button size="lg" type="submit">Save</Button>
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
      {#if result.success || result.error}
      <div class="my-4 md:mr-4">
        <div class="md:m-auto">
          <Alert border color="{result.success? 'green' : 'red'}">
            <InfoCircleSolid slot="icon" class="w-5 h-5" />
            {#if result.error}<span class="font-medium">{result.error?.message}</span>{:else}{result.success?.message}{/if}
          </Alert>
        </div>
      </div>
    {/if}
    </div>
  </form>
</div>
