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
    Modal,
    P,
    Span,
    Textarea,
    Toggle,
  } from "flowbite-svelte";
  import Autocomplete from "./Autocomplete.svelte";
  import type { ComponentAction, FormSubmitResult, Product } from "$lib/types";
  import FancyButton from "./FancyButton.svelte";
  import FileUpload from "./FileUpload.svelte";
  import { enhance } from "$app/forms";
  import { InfoCircleSolid } from "flowbite-svelte-icons";
  import { page } from "$app/stores";

  export let action: ComponentAction;
  export let product: Product | null = null;
  export let result: FormSubmitResult = {};

  let slug = $page.params.id;
  let productPricePerUnit = product?.productPricePerUnit;
  let productUnitSizeInMilliliters = product?.productUnitSizeInMilliliters;
  let productProof = product?.productProof;
  let categoryId = product?.categoryId;
  let productImageUrl = product?.productImageUrl;
  let modalOpen = false;

  const deleteItem = async () => {
    const response = await fetch(`/api/inventory/${slug}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    console.log(data)

  }

  const openModal = () => {
    modalOpen = true;
  }
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
        <div class="mt-4">
          <Label for="textarea-id" class="mb-2">Description</Label>
          <!-- <Textarea id="textarea-id" rows="4" name="message" class="h-36"/> -->
          <Textarea id="textarea-id" rows="4" name="message"/>
        </div>
        <div class="mt-4">
          <Toggle checked={true}>In Stock</Toggle>
        </div>
      </div>
    </div>

    <!-- submit -->
    <div class="md:flex md:flex-row">
      <div class="my-4 md:mr-4">
        <FancyButton style="grow md:flex-none" type="submit">Save</FancyButton>
      </div>
      {#if action === 'edit'}
        <div class="my-4">
          <FancyButton style="grow md:flex-none" type="button" color="orangeToRed" on:clicked={openModal}>Delete</FancyButton>
        </div>
      {/if}
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
  <Modal title="Confirm Delete" bind:open={modalOpen} autoclose>
    <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">
      Delete&nbsp;<Span>{product?.productName}</Span>&nbsp;from inventory?
      <P color="text-red-700 dark:text-red-500" weight="bold">Once deleted, it can't be recovered.</P>
    </p>
    <svelte:fragment slot="footer">
      <Button color="red" on:click={async () => {
        await deleteItem();
      }}>Delete</Button>
      <Button color="alternative">Cancel</Button>
    </svelte:fragment>
  </Modal>
</div>
