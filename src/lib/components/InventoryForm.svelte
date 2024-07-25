<script lang="ts">
  import {
    Label,
    Input,
    GradientButton,
    Card,
    Range,
    Button,
    Fileupload,
    Alert,
  } from "flowbite-svelte";
  import Autocomplete from "./Autocomplete.svelte";
  import type { ComponentAction, FormSubmitResult, Product } from "$lib/types";
  import FancyButton from "./FancyButton.svelte";
  import FileUpload from "./FileUpload.svelte";
  import { enhance } from "$app/forms";
  import { InfoCircleSolid } from "flowbite-svelte-icons";

  export let action: ComponentAction;
  export let product: Product | null = null;
  export let result: FormSubmitResult = {};
  
  let productPricePerUnit = product?.productPricePerUnit;
  let productUnitSizeInMilliliters = product?.productUnitSizeInMilliliters;
  let productProof = product?.productProof;
  let categoryId = product?.categoryId;
  let productImageUrl = product?.productImageUrl;
</script>

<div class="px-4 p-4 mt-3 bg-gray-50 rounded-lg dark:bg-gray-800">
  <form
    class="relative"
    method="POST"
    action="{action === 'add'? '?/add' : '?/edit'}"
    use:enhance
    enctype="multipart/form-data">
    <div class="grid gap-6 mb-6 md:grid-cols-2">
      <div>
        <Label for="productName" class="mb-2">Name</Label>
        <Input
          type="text"
          id="productName"
          name="productName"
          placeholder="Plantation 3 Star"
          required
          value={product?.productName} />
      </div>
      <div class="w-full">
        <Autocomplete
          label="Category"
          placeholder="Whiskey"
          fetchUrl="/api/select"
          name="categoryId"
          bind:value={categoryId}
          key={product?.categoryName} />
      </div>
    </div>
    <div class="grid gap-6 mb-6 md:grid-cols-3">
      <div>
        <Label for="productPricePerUnit" class="mb-2">Price</Label>
        <Input let:props required>
          <div slot="left" class="font-bold">$</div>
          <input
            name="productPricePerUnit"
            type="number"
            {...props}
            bind:value={productPricePerUnit} />
        </Input>
      </div>
      <div>
        <Label for="size" class="mb-2">Size</Label>
        <Input for="productUnitSizeInMilliliters" let:props required>
          <input
            id="productUnitSizeInMilliliters"
            name="productUnitSizeInMilliliters"
            type="number"
            placeholder=""
            {...props}
            bind:value={productUnitSizeInMilliliters} />
          <div slot="right" class="font-bold">mL</div>
        </Input>
      </div>
      <div>
        <Label for="abv" class="mb-2">Proof</Label>
        <Input for="productProof" let:props required>
          <input
            id="productProof"
            name="productProof"
            type="number"
            max="200"
            {...props}
            bind:value={productProof} />
          <div slot="right" class="font-bold">%</div>
        </Input>
      </div>
    </div>
    <div class="grid gap-6 mb-6 md:grid-cols-2">
      <div class="mt-4">
        <FileUpload name="productImageUrl" signedUrl={productImageUrl}></FileUpload>
      </div>
      <div>
        <div class="mt-4">
          <Label for="productSweetnessRating" class="mb-2">Sweetness</Label>
          <Range id="productSweetnessRating" name="productSweetnessRating" size="lg" value={50} />
        </div>
        <div class="mt-4">
          <Label for="productDrynessRating" class="mb-2">Dryness</Label>
          <Range id="productDrynessRating" name="productDrynessRating" size="lg" value={50} />
        </div>
      </div>
    </div>
    <div class="md:flex md:flex-row">
      <div>
        <FancyButton style="grow md:flex-none" type="submit">Save</FancyButton>
      </div>
        {#if result.success || result.error}
          <div class="my-4 md:my-0 md:ml-4">
            <Alert border color="{result.success? 'green' : 'red'}">
              <InfoCircleSolid slot="icon" class="w-5 h-5" />
              {#if result.error}<span class="font-medium">Could not save changes.</span>{/if}
              {result.success?.message || result.error?.message}
            </Alert>
          </div>
        {/if}
    </div>
  </form>
</div>
