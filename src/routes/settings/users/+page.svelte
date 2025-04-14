<script lang="ts">
    import { Heading } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import UserTable from '$lib/components/UserTable.svelte';
    
    export let data: PageData;
  
</script>

<div class="text-sm text-gray-500 dark:text-gray-400">
  <Heading tag="h4" class="mb-4 flex flex-row justify-between font-extrabold">
      User Management
  </Heading>
</div>
<UserTable users={data?.args} currentUser={data?.user}></UserTable>