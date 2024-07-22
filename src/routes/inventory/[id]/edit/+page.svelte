<script lang="ts">
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import { Heading } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import InventoryForm from '$lib/components/InventoryForm.svelte';
    
    export let data: PageData;
</script>

<Breadcrumb name="Inventory" href="/inventory">
  <BreadcrumbItem name="Add To Inventory"></BreadcrumbItem>
</Breadcrumb>
<div class="px-4 pb-4 mt-3 bg-gray-50 rounded-lg dark:bg-gray-800">
  <div class="text-sm text-gray-500 dark:text-gray-400">
      <div class="flex justify-end">
        <Heading tag="h4" class="mb-4 flex flex-row justify-between">
          Add To Inventory {data.args.product?.productId}
        </Heading>

      </div>
      <InventoryForm action="edit" product={data.args.product}/>
    </div>
</div>

<style lang="scss">

</style>