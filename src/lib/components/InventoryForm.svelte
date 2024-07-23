<script lang="ts">
  import {
    Label,
    Input,
    GradientButton,
    Card,
    Range,
    Button,
  } from "flowbite-svelte";
  import Autocomplete from "./Autocomplete.svelte";
  import type { ComponentAction, Product } from "$lib/types";
  import FancyButton from "./FancyButton.svelte";
  import FileUpload from "./FileUpload.svelte";
  import { enhance } from "$app/forms";

  export let action: ComponentAction;
  export let product: Product | null = null;
  let buttons = [
    { name: "Profile", mycustomfield: "data1", current: true },
    { name: "Settings", mycustomfield: "data2" },
    { name: "Messages", mycustomfield: "data3" },
    {
      name: "Download",
      mycustomfield: "data4",
      disabled: true,
      attrs: { type: "submit" },
    },
  ];

  let showGroup = true;
  let searchTerm = "";
  $: search = buttons.filter(
    ({ name }) => name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1,
  );

  const toggle = () => (showGroup = showGroup);

  const getValues = () => {
    // console.log(cat)
  };

  let productPricePerUnit = product?.productPricePerUnit;
  let productUnitSizeInMilliliters = product?.productUnitSizeInMilliliters;
  let productProof = product?.productProof;
  let categoryId = product?.categoryId;
  let uploadVal;
</script>

<div class="px-4 p-4 mt-3 bg-gray-50 rounded-lg dark:bg-gray-800">
  <form
    class="relative"
    method="POST"
    action="?/add"
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
    <div>
      <Label for="abv" class="mb-2">Image</Label>
      <FileUpload bind:value={uploadVal}></FileUpload>
      <Card img="{uploadVal}" horizontal size="md">
        <!-- <Input
          type="text"
          id="productName"
          name="productName"
          placeholder="Plantation 3 Star"
          required
          value={uploadVal} /> -->
      </Card>
      <div class="mt-4">
        <Label for="abv" class="mb-2">Proof</Label>
        <Range id="large-range" size="lg" value={50} />
      </div>
      <Label for="abv" class="mb-2">Proof</Label>
      <Range id="large-range" size="lg" value={50} />
      <div class="w-full py-4">
        <Button type="submit">Save</Button>
      </div>
    </div>
  </form>
</div>
