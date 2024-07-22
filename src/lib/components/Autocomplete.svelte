<script>
  import { Label, Listgroup, ListgroupItem, Input } from "flowbite-svelte";
  import { onMount } from "svelte";

  export let label;
  export let value;
  export let fetchUrl;
  export let placeholder = '';
  export let name;
  export let key;
  let items = [
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
  $: value = items.find(({ name }) => name.toLowerCase() === selectValue.toLocaleLowerCase())?.value || 0;


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
  <Label for="{name}" class="mb-2">{label}</Label>
  <input  id="{name}" {name} class="hidden" bind:value={value}>
  <Input type="text" placeholder="{placeholder}"
    on:blur={hideAutocomplete}
    on:focus={showAutocomplete} 
    bind:value={selectValue}
  >
  </Input>
  {#if show}
  <div class="relative">
    <Listgroup active class="absolute w-full max-h-44 overflow-y-auto z-20">
      {#each search as button, name}
        <ListgroupItem on:click={handleClick}>{button.name}</ListgroupItem>
      {/each}
      {#if !search.length}
        <ListgroupItem disabled>No Results</ListgroupItem>
      {/if}
    </Listgroup>
  </div>
  {/if}
</div>