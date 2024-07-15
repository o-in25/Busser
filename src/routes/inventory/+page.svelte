<script lang="ts">
    import { AdvancedRating, Button, ButtonGroup, Card, GradientButton, Heading, ImagePlaceholder, Modal, P, Rating, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch, type LinkType } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import { slide } from 'svelte/transition';
    import type { PaginationData, PaginationResult, Product } from '$lib/types';
    import { ArrowLeftOutline, ArrowRightOutline, ChevronLeftOutline, ChevronRightOutline, EditOutline, PlusOutline } from 'flowbite-svelte-icons';
    import InventoryTable from '$lib/components/InventoryTable.svelte';
    
    export let data: PageData;
    export let result: PaginationResult<Product[]> = data.args;
    $: {
      result.data = data.args.data
      result.pagination = data.args.pagination
    }</script>

<div class="p-4 bg-gray-50 rounded-lg dark:bg-gray-800 mt-4">
  <div class="text-sm text-gray-500 dark:text-gray-400">
      <div class="flex justify-end">
        <Heading tag="h4" class="mb-4 flex flex-row justify-between">
            Inventory
        </Heading>
        <ButtonGroup>
          <GradientButton color="purpleToBlue" href="/settings"><PlusOutline/></GradientButton>
        </ButtonGroup>
      </div>
      <InventoryTable products={result.data} paginationData={result.pagination}></InventoryTable>

    </div>
</div>

<style lang="scss">

</style>