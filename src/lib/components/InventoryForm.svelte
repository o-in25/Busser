<script lang="ts">
  import {
    Label,
    Input,
    Range,
    Button,
    Alert,
    Modal,
    P,
    Span,
    Textarea,
    Toggle,
		Toolbar,
		ToolbarButton,
		Spinner,
		Helper,
  } from "flowbite-svelte";
  import Autocomplete from "./Autocomplete.svelte";
  import type { ComponentAction, FormSubmitResult, Product } from "$lib/types";
  import FileUpload from "./FileUpload.svelte";
  import { enhance } from "$app/forms";
  import { BrainOutline, ImageOutline, InfoCircleSolid, WandMagicSparklesOutline } from "flowbite-svelte-icons";
  import { page } from "$app/stores";
  import { notificationStore } from "../../stores";
  import { getContext } from "svelte";

  export let action: ComponentAction;
  export let result: FormSubmitResult = {};
  export let product: Product | null = null;

  const permissions: string[] = getContext('permissions');

  let slug = $page.params.id;
  let productName = product?.productName;
  let productPricePerUnit = product?.productPricePerUnit;
  let productUnitSizeInMilliliters = product?.productUnitSizeInMilliliters;
  let productProof = product?.productProof;
  let categoryId = product?.categoryId;
  let productImageUrl = product?.productImageUrl;
  let productInStockQuantity = product?.productInStockQuantity || 0;
  let productSweetnessRating = product?.productSweetnessRating || 0.0;
  let productDrynessRating = product?.productDrynessRating || 0.0;
  let productStrengthRating = product?.productStrengthRating || 0.0;
  let productVersatilityRating = product?.productVersatilityRating || 0.0;
  let productDescription = product?.productDescription;

  // TODO: add a column constraint to productId col and do it that way
  let productDetailId = product?.productDetailId
  $: {
  }
  let modalOpen = false;

  const deleteItem = async () => {
    const response = await fetch(`/api/inventory/${slug}`, {
      method: 'DELETE'
    });

    const result = await response.json();
    if('data' in result) {
      $notificationStore.success = { message: 'Inventory item deleted.'}
      // goto(`/inventory`);
    } else {
      $notificationStore.error = { message: result.message || result.error }
    }

    
  }


  let showSpinner = false;
  let helperText = {
    show: false,
    text: ''
  };

  const generateText = async () => {
    if(!productName) {
      helperText = {
        show: true,
        text: 'A product name is required.'
      };
      return;
    }
    showSpinner = true;
    const response = await fetch('/api/generator/inventory', {
      method: 'POST',
      body: JSON.stringify({ productName })
    });

    const result = await response.json();
    
    showSpinner = false;

    if(result.description) {

      productDescription = result.description;
      return;
    }

    helperText = {
        show: true,
        text: 'Could not generate description'
    };
    // setTimeout(() => {
    //   productDescription = 'Hello';
    //   showSpinner = false;
    // }, 1500)
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
          required
          bind:value={productName} />
      </div>
      <div class="w-full">
        <Autocomplete
          label="Category"
          fetchUrl="/api/select/categories"
          actionUrl="/inventory/category/add"
          name="categoryId"
          grant="add_category"
          key={product?.categoryName}
          required={true}
          bind:value={categoryId}
        />
      </div>
    </div>
    <div class="grid gap-6 mb-6 md:grid-cols-3">
      <div>
        <Label for="productPricePerUnit" class="mb-2">Price</Label>
        <Input let:props required step="any">
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
        <Input let:props required>
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
        <Input let:props required>
          <input
            id="productProof"
            name="productProof"
            type="number"
            max="200"
            {...props}
            bind:value={productProof} />
          <!-- <div slot="right" class="font-bold">%</div> -->
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
          <Range id="productSweetnessRating" name="productSweetnessRating" size="lg" bind:value={productSweetnessRating} min="0" max="10" step="0.1"/>
          <!-- <Helper class="text-xs">
            We’ll never share your details. Read our <a href="/" class="font-medium text-primary-600 hover:underline dark:text-primary-500"> Privacy Policy </a>
            .
          </Helper> -->
        </div>
        <div class="mt-4">
          <Label for="productDrynessRating" class="mb-2">Dryness</Label>
          <Range id="productDrynessRating" name="productDrynessRating" size="lg" bind:value={productDrynessRating} min="0" max="10" step="0.1" />
        </div>
        <div class="mt-4">
          <Label for="productVersatilityRating" class="mb-2">Versatility</Label>
          <Range id="productVersatilityRating" name="productVersatilityRating" size="lg" bind:value={productVersatilityRating} min="0" max="10" step="0.1"/>
        </div>
        <div class="mt-4">
          <Label for="productStrengthRating" class="mb-2">Strength</Label>
          <Range id="productStrengthRating" name="productStrengthRating" size="lg" bind:value={productStrengthRating} min="0" max="10" step="0.1" />
        </div>
        <div class="mt-4 float-right">
          <input name="productInStockQuantity" type="hidden" bind:value={productInStockQuantity}>
          <Toggle checked={productInStockQuantity > 0} bind:value={productInStockQuantity} on:change={() => {
            if(productInStockQuantity > 0) {
              productInStockQuantity = 0
            } else {
              productInStockQuantity = 1;
            }
          }}>In Stock</Toggle>
        </div>
      </div>
    </div>
    <div class="mb-6">
      <Label for="textarea-id" class="mb-2">Description</Label>
      <div class="mt-4">
        <div class="flex items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700">
          <ToolbarButton color="dark" class="text-gray-500 dark:text-gray-400" on:click={generateText}>
            {#if showSpinner}
            <Spinner class="w-6 h-6"/>
            {:else}
                <BrainOutline class="w-6 h-6" />
                <span class="sr-only">Generate text</span>
            {/if}
          </ToolbarButton>
          <Textarea id="chat" class="mx-4 bg-white dark:bg-gray-800" rows={4} bind:value={productDescription} disabled={showSpinner}/>
          <!-- <Textarea id="textarea-id" rows="4" name="message" class="h-36"/> -->
        </div>
        {#if helperText.show}
        <Helper class="mt-2" color="red">
          <span class="font-medium">Oh, snapp!</span>
          {helperText.text}
        </Helper>
        {/if}
    </div>

    <input type="hidden" value={productDetailId}>

    <!-- submit -->
    <div class="md:flex md:flex-row">
      <div class="my-4 md:mr-4">
        <Button type="submit" size="lg">Save</Button>
      </div>
      {#if action === 'edit' && permissions.includes('delete_inventory')}
        <div class="my-4">
          <Button type="button" size="lg" color="red" on:click={openModal}>Delete</Button>
        </div>
      {/if}
        {#if result.success || result.error}
          <div class="my-4 md:ml-4">
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
