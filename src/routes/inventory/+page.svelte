<script lang="ts">
  import { ButtonGroup, GradientButton, Heading } from 'flowbite-svelte';
  import type { PageData } from './$types';
  import type { PaginationResult, Product } from '$lib/types';
  import { PlusOutline } from 'flowbite-svelte-icons';
  import InventoryTable from '$lib/components/InventoryTable.svelte';
  
  export let data: PageData;
  export let result: PaginationResult<Product[]> = data.args;
  $: {
    result.data = data.args.data
    result.pagination = data.args.pagination
  }
</script>
<div class="mt-5">
  <Heading tag="h4" class="mb-4 flex flex-row justify-between">
    Inventory
  </Heading>
</div>
<div class="px-4 py-2 md:py-4">
  <InventoryTable products={result.data} paginationData={result.pagination}></InventoryTable>
</div>

<style lang="scss">

</style>