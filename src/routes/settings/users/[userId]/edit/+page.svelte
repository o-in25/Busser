<script lang="ts">
    import { Alert } from 'flowbite-svelte';
    import { InfoCircleSolid } from 'flowbite-svelte-icons';
    import type { ActionData, PageData } from './$types';
    import UserForm from '$lib/components/UserForm.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import { getContext } from 'svelte';
    
    export let form: ActionData;
    export let data: PageData;
    const permissions: string[] = getContext('permissions') || [];

</script>
<svelte:head>
    <title>Edit User - Busser</title> 
</svelte:head>
{#if permissions.includes('admin_edit')}
<Breadcrumb name="Users" href="/settings/users">
  <BreadcrumbItem name="Edit User"></BreadcrumbItem>
</Breadcrumb>
{/if}
<div class="px-4 pb-4 mt-3 flex justify-left items-center">
  <div class="grow">
    <UserForm user={data.user} action='edit' roles={data.roles}></UserForm>
  </div>
</div>
