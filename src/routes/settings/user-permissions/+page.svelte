<script lang="ts">
	import { Button, Input, Label, Modal, Select } from 'flowbite-svelte';
  import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { ExclamationCircleOutline, MinusOutline, ThumbsUpSolid, TrashBinOutline } from 'flowbite-svelte-icons';
	import { page } from '$app/state';

    let { data }: { data: PageData } = $props();
    let selected = $state(page.url.searchParams.get('role') || '');
    let role = $derived(data.roles.find(({ value }) => value === selected));
    // svelte-ignore non_reactive_update
        let formDataInput;

    let modalState = $state({
      open: false,
      data: {
        text: '',
        index: 0
      }
    })

    let addItem = () => ({
      permissionId: '',
      permissionName: '',
      roleId: '',
      roleName: ''
    })

    const initialItems = structuredClone(data.grants);
    let items = $derived([...data.grants, addItem()]);
    // let isDirty = $derived(JSON.stringify(items.filter((item) => item.permissionName.trim() !== '')) !== JSON.stringify(initialItems));


    function handleSelectChange() {
      const params = new URLSearchParams({ role: selected });
      goto(`/settings/user-permissions?${params}`);
    }


    function setModalState(open, data) {
      modalState = { open, data};
    }
    

    function handleInputChange(grant, index) {
      const last = items.length - 1;
      const isLast = index === last;
      const isEmpty = grant.permissionName.trim() === '';

      if (isLast && !isEmpty) {
        items = [...items, addItem()];
      }

      if (!isLast && index === last - 1 && isEmpty) {
        // check if the last input is blank too
        const lastItem = items[items.length - 1];
        if (lastItem.permissionName.trim() === '') {
          items = items.slice(0, -1);
        }
      }

    }

    function handleSubmit() {
      formDataInput.value = JSON.stringify(items.filter(({ permissionName }) => permissionName.trim() !== ''));
    }

    function handleDelete(index) {
      items = [...items.slice(0, index), ...items.slice(index + 1)];
    }
</script>

<form>
  <div class="mb-4">
    <Label>
      Select a Role
      <Select class="mt-2" items={data.roles} on:change={handleSelectChange} bind:value={selected}/>
    </Label>
  </div>
</form>

{#if selected}
<form action="/settings/user-permissions?role={role?.value}" method="POST" onsubmit={handleSubmit}>
  <div class="grid gap-6 mb-6 md:grid-cols-2">
    {#each items as grant, index}
     <div class="flex">
       <Input type="text" id={grant.permissionId} bind:value={grant.permissionName} on:input={() => handleInputChange(grant, index)}/>
       {#if grant.permissionId}
        <Button class="!px-4 ms-2 flex items-center" on:click={() => setModalState(true, {
          text: grant.permissionName,
          index
        })} >
          <TrashBinOutline class="w-3 h-3 mx-auto"/>
        </Button>
       {/if}

     </div>
    {/each}


  </div>
  <div class="my-4 md:mr-4 order-2 flex justify-end">
    <input type="hidden" class="hidden" name="formData" id="formData" bind:this={formDataInput}/>
    <Button
      class="w-full md:w-32"
      type="submit"
      size="xl"
    >
      Save
    </Button>
  </div>
</form>
{/if}
<Modal bind:open={modalState.open} size="xs" autoclose>
  <div class="text-center">
    <ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
    <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete {modalState.data.text}</h3>
    <Button color="red" class="me-2" onclick={() => handleDelete(modalState.data.index)}>Yes, I'm sure</Button>
    <Button color="alternative">No, cancel</Button>
  </div>
</Modal>