<script lang="ts">
  import { Input, Label } from "flowbite-svelte";
  import FancyButton from "./FancyButton.svelte";
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
    
    <!-- submit -->
    <div class="md:flex md:flex-row">
      <div class="my-4 md:mr-4">
        <FancyButton style="grow md:flex-none" type="submit">Save</FancyButton>
      </div>
    </div>
  </form>
</div>
