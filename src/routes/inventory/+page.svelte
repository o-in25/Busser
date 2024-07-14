<script lang="ts">
    import { AdvancedRating, Card, Heading, ImagePlaceholder, Modal, P, Pagination, Rating, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch, type LinkType } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import { slide } from 'svelte/transition';
    import type { Product } from '$lib/types';
    import { ArrowLeftOutline, ArrowRightOutline, ChevronLeftOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
    import InventoryTable from '$lib/components/InventoryTable.svelte';
    
    export let data: PageData;
    let searchTerm = '';

    const products: Product[] = data.args.data;
</script>

<div class="p-4 bg-gray-50 rounded-lg dark:bg-gray-800 mt-4">
  <div class="text-sm text-gray-500 dark:text-gray-400">
      <Heading tag="h4" class="mb-4 flex flex-row justify-between">
          Inventory
      </Heading>
      <div>
        <div id="inventory-table">
          <InventoryTable {products}></InventoryTable>
        </div>
      </div>
    </div>
</div>

<style lang="scss">

</style>