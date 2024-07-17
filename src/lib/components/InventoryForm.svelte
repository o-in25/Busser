<script lang="ts">
  import { Label, Checkbox, A, Button, Input, Listgroup, ListgroupItem, InputAddon, NumberInput, GradientButton } from "flowbite-svelte";
  import Autocomplete from "./Autocomplete.svelte";
  import { onMount } from "svelte";
    import { DollarOutline, EditOutline, SearchOutline } from "flowbite-svelte-icons";
  
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

  let cat;

  const getValues = () => {
    console.log(cat)
  }
  let price;
  let size;

</script>

<form class="relative" method="POST">
  <div class="grid gap-6 mb-6 md:grid-cols-2">
    <div>
      <Label for="first_name" class="mb-2">Name</Label>
      <Input type="text" id="first_name" placeholder="Plantation 3 Star" required />
    </div>
    <div class="w-full">
      <Autocomplete label="Category" placeholder="Whiskey" fetchUrl="/api/select" bind:value={cat}/>
    </div>
  </div>
  <div class="grid gap-6 mb-6 md:grid-cols-3">
    <div>
      <Label for="first_name" class="mb-2">Price</Label>
      <Input let:props required>
        <div slot="left" class="font-bold">$</div>
        <input type="number" {...props} bind:value={price} />
      </Input>
    </div>
    <div>
      <Label for="first_name" class="mb-2">Size</Label>
      <Input let:props required>
        <input type="number" {...props} bind:value={size} />
        <div slot="right" class="font-bold">mL</div>
      </Input>
    </div>
        <div>
      <Label for="first_name" class="mb-2">ABV</Label>
      <Input let:props required>
        <input type="number" {...props} bind:value={size} />
        <div slot="right" class="font-bold">%</div>
      </Input>
    </div>
  </div>
    <GradientButton color="purpleToBlue" type="submit">Save</GradientButton>
</form>