<script lang="ts">
    import { Heading, P } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import { AngleRightOutline } from 'flowbite-svelte-icons';
    import InventoryForm from '$lib/components/InventoryForm.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import RTable from '$lib/components/RTable.svelte';
    
    export let data: PageData;
</script>

<Breadcrumb name="Inventory" href="/inventory">
  <BreadcrumbItem name="Add To Inventory"></BreadcrumbItem>
</Breadcrumb>
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