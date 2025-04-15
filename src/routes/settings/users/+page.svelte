<script lang="ts">
    import { Heading } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import UserTable from '$lib/components/UserTable.svelte';
	import type { User } from '$lib/types/auth';
    
    export let data: PageData;
    let currentUser = data?.user || {} as User;
  
</script>
<svelte:head>
    <title>Users - Busser</title> 
</svelte:head>
<div class="text-sm text-gray-500 dark:text-gray-400">
  <Heading tag="h4" class="mb-4 flex flex-row justify-between font-extrabold">
      User Management
  </Heading>
</div>
<UserTable users={data?.args} {currentUser}></UserTable>