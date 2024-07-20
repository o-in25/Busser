<script lang="ts">
    import { Heading } from 'flowbite-svelte';
    import { AdjustmentsVerticalSolid, UsersOutline } from 'flowbite-svelte-icons';
    import type { PageData } from './$types';
    import UserTable from '$lib/components/UserTable.svelte';
    
    export let data: PageData;
  
</script>

<div class="text-sm text-gray-500 dark:text-gray-400">
  <Heading tag="h4" class="mb-4 flex flex-row justify-between">
      User Management
  </Heading>
</div>
<UserTable users={data?.args}></UserTable>