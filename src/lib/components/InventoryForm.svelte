<script lang="ts">
  import {
    Label,
    Input,
    GradientButton,
    Card,
    Range,
    Button,
    Fileupload,
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
        <FileUpload name="productImageUrl"></FileUpload>
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
    <div class="w-1/2 m-auto">
      <Button outline type="submit">Save</Button>
    </div>
  </form>
</div>
