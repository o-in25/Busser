<script>
  import { Label, Listgroup, ListgroupItem, Input } from "flowbite-svelte";

  export let label;
  export let placeholder = '';
  export let value;

  let buttons = [
    { name: 'Profile', mycustomfield: 'data1', current: true },
    { name: 'Settings', mycustomfield: 'data2' },
    { name: 'Messages', mycustomfield: 'data3' },
    { name: 'Download', mycustomfield: 'data4', disabled: true, attrs: {type: 'submit'} }
  ];



  let show = false;
  $: selectValue = '';
  $: search = buttons.filter(({ name }) => name.toLowerCase().indexOf(selectValue.toLowerCase()) !== -1);
  $: value = selectValue;
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
  <Label for="last_name" class="mb-2">{label}</Label>
  <Input type="text" id="last_name" placeholder="{placeholder}"
    on:blur={hideAutocomplete}
    on:focus={showAutocomplete} 
    bind:value={selectValue}
  >
  </Input>
  {#if show}
  <div class="relative">
    <Listgroup active class="absolute w-full">
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