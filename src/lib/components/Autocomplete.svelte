<script lang="ts">
  import { Label, Listgroup, ListgroupItem, Input, ButtonGroup, Button } from "flowbite-svelte";
    import { PlusOutline } from "flowbite-svelte-icons";
    import InputAddon from "flowbite-svelte/InputAddon.svelte";
  import { getContext, onMount } from "svelte";

  export let label;
  export let value;
  export let fetchUrl;
  export let placeholder = '';
  export let name = '';
  export let key;
  export let required = false;
  export let actionUrl = '';
  export let grant = ''
  const permissions: string[] = getContext('permissions');

  let items: any = [
    // { name: 'Profile', mycustomfield: 'data1', current: true },
    // { name: 'Settings', mycustomfield: 'data2' },
    // { name: 'Messages', mycustomfield: 'data3' },
    // { name: 'Download', mycustomfield: 'data4', disabled: true, attrs: {type: 'submit'} }
  ];

  onMount(async () => {
    let response = await fetch(fetchUrl, {
      method: 'GET',
    });
    const selectOptions = await response.json();
    items = selectOptions;
  })

  let show = false;
  $: selectValue = key || '';
  $: search = items.filter(({ name }) => name.toLowerCase().indexOf(selectValue.toLowerCase()) !== -1);
  $: value = items.find(({ name }) => name.toLowerCase() === selectValue.toLocaleLowerCase())?.value || value || null;
  $: disabled = items.length === 0;

  const showAutocomplete = () => show = true;
  // theres a race condition b/w onblur and onclick, so we timeout 
  const hideAutocomplete = () => setTimeout(() => {
    if(!search.length) {
      selectValue = '';
    }
    show = false;
  }, 100)

  const handleClick = ({ target }) => {
    selectValue = target.innerText;
    show = false;
  }


</script>
<div class="w-full">
  <slot> </slot>
  {#if name}
    <Label for="{name}" class="mb-2">{label}</Label>
    <input id="{name}" {name} class="hidden" bind:value={value}>
  {:else}
    <Label for="autoselect" class="mb-2">{label}</Label>
    <input id="autoselect" class="hidden" bind:value={value}>
  {/if}
  <ButtonGroup divClass="flex">
    <Input type="text" placeholder="{placeholder}"
      on:focus={showAutocomplete}
      bind:value={selectValue}
      bind:required={required}
      bind:disabled={disabled}
    >
    </Input>
    {#if actionUrl && (!grant || grant && permissions.includes(grant))} 
      <Button color="purple" href="/inventory/category/add"><PlusOutline/></Button>
    {/if}
  </ButtonGroup>
  {#if show}
  <div class="relative">
    <Listgroup active class="absolute w-full max-h-44 overflow-y-auto z-20">
      {#each search as button}
        <ListgroupItem on:click={handleClick}>{button.name}</ListgroupItem>
      {/each}
      {#if !search.length}
        <ListgroupItem disabled>No Results</ListgroupItem>
      {/if}
    </Listgroup>
  </div>
  {/if}
</div>