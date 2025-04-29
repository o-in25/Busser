<script lang="ts">
	import { Button, Input, Label, Modal, Select } from 'flowbite-svelte';
    import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { ExclamationCircleOutline, MinusOutline, ThumbsUpSolid, TrashBinOutline } from 'flowbite-svelte-icons';

    let { data }: { data: PageData } = $props();
    let selected = 'f2687fee-0e75-11f0-9f4d-42010a400003';

    let modalState = $derived({
      open: false,
      data: null
    })

    function handleSelectChange() {
      const params = new URLSearchParams({ role: selected });
      goto(`/settings/user-permissions?${params}`);
    }


    function setModalState(open, data) {
      modalState = { open, data};
    }


</script>

<form>
  <div class="mb-4">
    <Label>
      Select a Role
      <Select class="mt-2" items={data.roles} on:change={handleSelectChange} bind:value={selected}/>
    </Label>
  </div>
  <div class="grid gap-6 mb-6 md:grid-cols-2">
    {#each data.grants as grant (grant.permissionId)}
     <div class="flex">
       <Input type="text" id="first_name" placeholder="John" bind:value={grant.permissionName}/>
       <Button class="!px-4 ms-2 flex items-center" on:click={() => setModalState(true, grant.permissionId)} >
          <TrashBinOutline class="w-3 h-3 mx-auto"/>
       </Button>
     </div>
    {/each}

  </div>
</form>

<Modal bind:open={modalState.open} size="xs" autoclose>
  <div class="text-center">
    <ExclamationCircleOutline class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" />
    <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Are you sure you want to delete {modalState.data}</h3>
    <Button color="red" class="me-2">Yes, I'm sure</Button>
    <Button color="alternative">No, cancel</Button>
  </div>
</Modal>