<script lang="ts">
  import { Label, Checkbox, A, Button, Input, Listgroup, ListgroupItem } from "flowbite-svelte";
  import Autocomplete from "./Autocomplete.svelte";
    import { onMount } from "svelte";
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

</script>

<form class="relative">
  <div class="grid gap-6 mb-6 md:grid-cols-2">
    <div>
      <Label for="first_name" class="mb-2">Name</Label>
      <Input type="text" id="first_name" placeholder="Plantation 3 Star" required />
    </div>
    <div class="w-full">
      <!-- <Label for="last_name" class="mb-2">Category</Label>
      <Input type="text" id="last_name" placeholder="Doe" required bind:value={searchTerm}/> -->
      <Autocomplete label="Category" placeholder="Whiskey" fetchUrl="/api/select" bind:value={cat}/>
      <!-- <div class="relative">
        <Listgroup active class="absolute w-full" >
          {#each search as button, name}
            <ListgroupItem>{button.name}</ListgroupItem>
          {/each}
          {#if !search.length}
            <ListgroupItem disabled>No Results</ListgroupItem>
          {/if}
        </Listgroup>
      </div> -->
    </div>
  </div>
  <Checkbox class="mb-6 space-x-1 rtl:space-x-reverse" required>
    I agree with the <A href="/" class="text-primary-700 dark:text-primary-600 hover:underline">terms and conditions</A>.
  </Checkbox>
  <Button on:click={getValues}>Submit</Button>
</form>