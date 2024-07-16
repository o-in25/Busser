<script lang="ts">
    import { Heading } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import { AngleRightOutline } from 'flowbite-svelte-icons';
    import InventoryForm from '$lib/components/InventoryForm.svelte';
    
    export let data: PageData;
</script>

<nav class="flex" aria-label="Breadcrumb">
  <ol class="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
    <li class="inline-flex items-center">
      <a href="/inventory" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white">
        Inventory
      </a>
    </li>
    <li>
      <div class="flex items-center">
        <div class="text-gray-500 dark:text-gray-400">
          <AngleRightOutline/>
        </div>
        <span class="ms-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ms-2 dark:text-gray-400">Add To Inventory</span>
      </div>
    </li>
  </ol>
</nav>
<div class="px-4 pb-4 mt-3 bg-gray-50 rounded-lg dark:bg-gray-800">
  <div class="text-sm text-gray-500 dark:text-gray-400">
      <div class="flex justify-end">
        <Heading tag="h4" class="mb-4 flex flex-row justify-between">
          Add To Inventory
        </Heading>
      </div>
      <InventoryForm/>
    </div>
</div>

<style lang="scss">

</style>