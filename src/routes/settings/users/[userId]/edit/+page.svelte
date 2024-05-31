<script lang="ts">
    import UserTable from '$lib/components/UserTable.svelte';
    import { A, Breadcrumb, BreadcrumbItem, Heading } from 'flowbite-svelte';
    import { AdjustmentsVerticalSolid, AngleLeftOutline, ChevronDoubleRightOutline, HomeOutline, UsersOutline } from 'flowbite-svelte-icons';
    import type { PageData } from './$types';
    
    export let data: PageData;
</script>

<ul class="flex flex-wrap space-x-2 rtl:space-x-reverse">
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
</ul>
<div class="h-0.5 bg-gray-200 dark:bg-gray-700"></div>
<div class="p-4 bg-gray-50 rounded-lg dark:bg-gray-800 mt-4">
  <div class="text-sm text-gray-500 dark:text-gray-400">

  </div>
  <div class="flex justify-left items-center">
    <div class="grow">
      blah
    </div>
  </div>
</div>