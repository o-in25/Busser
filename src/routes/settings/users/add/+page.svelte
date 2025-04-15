<script lang="ts">
    import { Alert } from 'flowbite-svelte';
    import { InfoCircleSolid } from 'flowbite-svelte-icons';
    import type { ActionData, PageData } from './$types';
    import UserForm from '$lib/components/UserForm.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    
    export let form: ActionData;
    export let data: PageData;
</script>

<svelte:head>
    <title>Add User - Busser</title> 
</svelte:head>
<Breadcrumb name="Users" href="/settings/users">
  <BreadcrumbItem name="Add User" href="/settings/user/add"></BreadcrumbItem>
</Breadcrumb>
<div class="px-4 pb-4 mt-3 flex justify-left items-center">
  <div class="grow">
    <UserForm action='add' roles={data.roles}></UserForm>
  </div>
</div>
