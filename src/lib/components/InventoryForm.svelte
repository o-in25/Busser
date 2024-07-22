<script lang="ts">
  import { Label, Input, GradientButton } from "flowbite-svelte";
  import Autocomplete from "./Autocomplete.svelte";
    import type { ComponentAction, Product } from "$lib/types";
    
  export let action: ComponentAction;
  export let product: Product | null = null;
  let buttons = [
    { name: 'Profile', mycustomfield: 'data1', current: true },
    { name: 'Settings', mycustomfield: 'data2' },
    { name: 'Messages', mycustomfield: 'data3' },
    { name: 'Download', mycustomfield: 'data4', disabled: true, attrs: {type: 'submit'} }
  ];

  let showGroup = true;
  let searchTerm = '';
  $: search = buttons.filter(({ name }) => name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1);

  const toggle = () => showGroup = showGroup;


  const getValues = () => {
    // console.log(cat)
  }

  let productPricePerUnit = product?.productPricePerUnit || undefined;
  let productUnitSizeInMilliliters= product?.productUnitSizeInMilliliters || undefined;
  let productProof = product?.productProof || undefined;
  let categoryId = product?.categoryId || undefined;

</script>

<form class="relative" method="POST" action="?/add">
  <div class="grid gap-6 mb-6 md:grid-cols-2">
    <div>
      <Label for="productName" class="mb-2">Name {product?.productName}</Label>
      <Input type="text" id="productName" name="productName" placeholder="Plantation 3 Star" required value={product?.productName}/>
    </div>
    <div class="w-full">
      <Autocomplete label="Category" placeholder="Whiskey" fetchUrl="/api/select" name="categoryId" bind:value={categoryId} key={product?.categoryName}/>
    </div>
  </div>
  <div class="grid gap-6 mb-6 md:grid-cols-3">
    <div>
      <Label for="productPricePerUnit" class="mb-2">Price</Label>
      <Input let:props required>
        <div slot="left" class="font-bold">$</div>
        <input name="productPricePerUnit" type="number" {...props} bind:value={productPricePerUnit} />
      </Input>
    </div>
    <div>
      <Label for="size" class="mb-2">Size</Label>
      <Input for="productUnitSizeInMilliliters" let:props required>
        <input id="productUnitSizeInMilliliters" name="productUnitSizeInMilliliters" type="number" {...props} bind:value={productUnitSizeInMilliliters} />
        <div slot="right" class="font-bold">mL</div>
      </Input>
    </div>
    <div>
      <Label for="abv" class="mb-2">Proof</Label>
      <Input for="productProof" let:props required>
        <input id="productProof" name="productProof" type="number"  max="200" {...props} bind:value={productProof}/>
        <div slot="right" class="font-bold">%</div>
      </Input>
    </div>
  </div>
  <div class="w-full flex sm:block">
    <GradientButton color="purple" type="submit" class="flex-grow mt-6" size="lg">Save</GradientButton>
  </div>
</form>