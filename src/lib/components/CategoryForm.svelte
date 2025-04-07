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
  import type { Category, FormSubmitResult, QueryResult, Table } from "$lib/types";
  import { applyAction, enhance } from "$app/forms";
	import { goto } from "$app/navigation";
	import { notificationStore } from "../../stores";
  let error = false;
  // export let result: FormSubmitResult = {};
  export let category: Table.Category = {} as Table.Category;
</script>

<div class="px-4 p-4 mt-3 bg-gray-50 rounded-lg dark:bg-gray-800">
  <form class="grid gap-6 mb-6" method="POST" use:enhance={() => {
    return async ({ result }) => {
      if (result.type === "redirect") {
        goto(result.location);
      } else {
        await applyAction(result);
        if (result.type === "failure")
          $notificationStore.error = {
            message: result?.data?.error?.toString() || "",
          };
        if (result.type === "success")
          $notificationStore.success = { message: "Category updated." };
      }
    };
  }}>
    <div>
      <Label
        for="categoryName"
        class="block mb-2">
        Name
      </Label>
      <Input
        id="categoryName"
        name="categoryName"
        bind:value={category.categoryName} />
    </div>
    <div>
      <Label for="categoryDescription" class="mb-2">Description</Label>
      <Textarea id="categoryDescription" name="categoryDescription" rows={4} bind:value={category.categoryDescription}/>
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
    </div>
  </form>
</div>
