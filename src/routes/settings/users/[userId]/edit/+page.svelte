<script lang="ts">
    import { A, Alert, Heading } from 'flowbite-svelte';
    import { AdjustmentsVerticalSolid, InfoCircleSolid, UsersOutline } from 'flowbite-svelte-icons';
    import type { ActionData, PageData } from './$types';
    import UserForm from '$lib/components/UserForm.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    
    export let form: ActionData;
    export let data: PageData;
</script>

<!-- <ul class="flex flex-wrap space-x-2 rtl:space-x-reverse">
   <li class="group" role="presentation">
      <a href="/settings" type="button" role="tab" class="inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 text-gray-500 rounded-t-lg hover:text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-300">
         <div class="flex items-center gap-2">
          <AdjustmentsVerticalSolid size="md" />General
         </div>
      </a>
   </li>
    <li class="group" role="presentation">
      <a href="/settings/users" type="button" role="tab" class="inline-block text-sm font-medium text-center disabled:cursor-not-allowed p-4 text-primary-600 bg-gray-100 rounded-t-lg dark:bg-gray-800 dark:text-primary-500 active">
         <div class="flex items-center gap-2">
          <UsersOutline size="md" />Users
         </div>
      </a>
   </li>
</ul> -->
<!-- <div class="h-0.5 bg-gray-200 dark:bg-gray-700"></div> -->
<Breadcrumb name="Users" href="/settings/users">
  <BreadcrumbItem name="Edit User"></BreadcrumbItem>
</Breadcrumb>
  <div class="px-4 pb-4 mt-3 flex justify-left items-center">
    <div class="grow">
      {#if form?.error || form?.success}
      <Alert border color="{form.error? 'red' : 'green'}" class="mb-4">
        <InfoCircleSolid slot="icon" class="w-5 h-5" />
        {form.error? form.error.message : form.success.message}
      </Alert>
      {/if}
      <UserForm user={data?.args} action='edit'></UserForm>
    </div>
  </div>
