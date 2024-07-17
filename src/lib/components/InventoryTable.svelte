<script lang="ts">
  import type { PaginationData, Product } from '$lib/types';
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Indicator,
    Pagination,
    TableSearch,
    Alert,
    Input,
    Label,
    Progressbar,
    Badge,


  } from 'flowbite-svelte';
  import { ChevronLeftOutline, ChevronRightOutline, InfoCircleSolid, SearchOutline } from 'flowbite-svelte-icons';
  import { slide } from 'svelte/transition';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import InventoryItem from './InventoryItem.svelte';

  import debounce from 'lodash';
  export let products: Product[];
  export let paginationData: PaginationData;

  let openRow: number | null
  // let details: { name: any; }
  // let doubleClickModal = false
  let searchTerm = '';

  const rowControl = (row: number) => openRow = openRow === row ? null : row

  const paginate = ({ total, perPage }) => {
    let range = Math.ceil(total / perPage);
    return [...Array(range)]
      .map((_, index) => index + 1)
      .map(page => page.toString())
      .map(page => ({
        name: page, 
        href: `/inventory?page=${page}`,
        active: false
      }))
  }

  $: search = products.filter(({ productName }) => productName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1);
  $: activeUrl = $page.url.searchParams.get('page');
  $: pages = paginate(paginationData);
  $: {
    if(!activeUrl) {
      const [first] = pages;
      first.active = true;
    } else {
      pages?.forEach((page) => {
        let queryString = page.href.split('?').slice(1).join('?');
        const params = new URLSearchParams(queryString);
        page.active = params.get('page') === activeUrl;
      });
      pages = pages;
    }

  }


  const previous = () => goto('/inventory?page=1');
  const next = () => goto(`/inventory?page=${paginationData.lastPage}`);

  const parseSize = (ml: number) => {
    if(ml === 0) return 'N/A'
    if(ml < 1000) return `${ml} ML`
    return  `${ml / 1000} L`
  }
  let money = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
  });

  //  const handleInput = debounce((e: Event) => {
  //   const detail = (<CustomEvent>e).detail;
  //   search = products.filter(({ productName }) => productName.toLowerCase().indexOf(e.target.value.toLowerCase()) !== -1)
  // })

  const handleInput = ({ target }) => {
    setTimeout(() => {
      searchTerm = target.value;
      search = products.filter(({ productName }) => productName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1);
    }, 300);
  }
</script> 
<!-- <input on:keydown={(event) => handleInput(event)}> -->
<div>
  <!-- "grid gap-6 mb-6 md:grid-cols-2 -->

</div>
<!-- search -->
<Label class="space-y-2 mb-6">
  <Input type="email" size="md" placeholder="Search inventory..." on:keydown={handleInput}>
    <SearchOutline slot="left" class="w-5 h-5" />
  </Input>
</Label>

<!-- table -->
<Table divClass="relative overflow-x-auto" hoverable={true}>

  <!-- head -->
  <TableHead>
    <TableHeadCell>Product Name</TableHeadCell>
    <TableHeadCell class="hidden sm:table-cell">Category</TableHeadCell>
    <TableHeadCell class="hidden sm:table-cell">Inventory</TableHeadCell>
    <TableHeadCell class="hidden sm:table-cell">Strength</TableHeadCell>
  </TableHead>

  <!-- body -->
  <TableBody tableBodyClass="divide-y">

    <!-- rows -->
    {#each search as product, row}
      <TableBodyRow on:click={() => rowControl(row)}>
        <TableBodyCell>{product.productName}</TableBodyCell>
        <TableBodyCell tdClass="hidden sm:table-cell sm:px-6 sm:py-4 sm:whitespace-nowrap">{product.categoryName}</TableBodyCell>
          <TableBodyCell tdClass="hidden sm:table-cell sm:px-6 sm:py-4 sm:whitespace-nowrap">
            <span class="flex items-center">
              {#if product.productInStockQuantity < 1}
                <Indicator size="sm" color="red" class="me-1.5" />Out of stock
              {:else}
                <Indicator size="sm" color="green" class="me-1.5" />In stock
              {/if}
            </span>
          </TableBodyCell>
        <TableBodyCell tdClass="hidden sm:table-cell sm:px-6 sm:py-4 sm:whitespace-nowrap">
          {#if product.productProof < 1}
          <!-- <Progressbar progress="{product.productProof / 2}" /> -->
           <Badge rounded color="dark" class="w-full h-auto">N/A</Badge>
           {:else}
              <Progressbar progress="{product.productProof / 2}" />
          {/if}
        </TableBodyCell>
      </TableBodyRow>

      <!-- opened  -->
      {#if openRow === row}
        <TableBodyRow class=""  on:dblclick={() => {
          // doubleClickModal = true;
          // details = product;
        }}>
          <TableBodyCell colspan="6" class="p-0" tdClass="border-b last:border-b-0 bg-white dark:bg-gray-800 dark:border-gray-700">
            <div class="px-3 py-3" transition:slide={{ duration: 300, axis: 'y' }}>
              <InventoryItem {product}></InventoryItem>
            </div>
          </TableBodyCell>
        </TableBodyRow>
      {/if}

    {/each}
  </TableBody>
</Table>
{#if !search.length}
  <div class="flex flex-col items-center">
    <Alert color="dark">
      <InfoCircleSolid slot="icon" class="w-5 h-5" />
      <span class="font-medium">We couldn't find that!</span>
      So that means you should add it...
    </Alert>
  </div>
{/if}
{#if searchTerm === ''}
  <div class="flex flex-col items-center justify-center gap-2 p-7">
    <div class="text-sm text-gray-700 dark:text-gray-400">
      Showing <span class="font-semibold text-gray-900 dark:text-white">{paginationData.from + 1}</span>
      to <span class="font-semibold text-gray-900 dark:text-white">{paginationData.to}</span>
      of <span class="font-semibold text-gray-900 dark:text-white">{paginationData.total}</span> Entries
    </div>
    <Pagination {pages} on:previous={previous} on:next={next} large>
      <svelte:fragment slot="prev">
        <span class="sr-only">Previous</span>
        <ChevronLeftOutline class="w-6 h-6" />
      </svelte:fragment>
      <svelte:fragment slot="next">
        <span class="sr-only">Next</span>
        <ChevronRightOutline class="w-6 h-6" />
      </svelte:fragment>
    </Pagination>
  </div>
{/if}
<!-- <Modal title={details?.name} bind:open={doubleClickModal} autoclose outsideclose>
  <ImagePlaceholder />
</Modal> -->