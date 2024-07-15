<script lang="ts">
  import type { PaginationData, Product } from '$lib/types';
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    ImagePlaceholder,
    Modal,
    Indicator,
    Pagination
  } from 'flowbite-svelte';
  import { slide } from 'svelte/transition';
  import InventoryItem from './InventoryItem.svelte';


  export let products: Product[];
  export let paginationData: PaginationData;
  // export let pagination: Pagination;
  let openRow
  let details
  let doubleClickModal = false

  const toggleRow = (row: number) => openRow = openRow === row ? null : row
  const parseSize = (ml: number) => {
    if(ml === 0) return 'N/A'
    if(ml < 1000) return `${ml} ML`
    return  `${ml / 1000} L`
  }

  let USDollar = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
  });

  import { page } from '$app/stores';
  import { ChevronLeftOutline, ChevronRightOutline } from 'flowbite-svelte-icons';
  import { goto, invalidateAll } from '$app/navigation';
  import { createEventDispatcher } from 'svelte';

  $: activeUrl = $page.url.searchParams.get('page');

    let pages = [
    { name: '1', href: '/inventory?page=1', active: false },
    { name: '2', href: '/inventory?page=2', active: false  },
    { name: '3', href: '/inventory?page=3', active: false  },
    { name: '4', href: '/inventory?page=4', active: false  },
  ];
  $: {
    pages?.forEach((page) => {
      let splitUrl = page.href.split('?');
      let queryString = splitUrl.slice(1).join('?');
      const hrefParams = new URLSearchParams(queryString);
      let hrefValue = hrefParams.get('page');
      if (hrefValue === activeUrl) {
        page.active = true;
      } else {
        page.active = false;
      }
    });
    pages = pages;
  }

  const previous = () => {
    console.log('sfd')
   goto('/inventory?page=1') 
  };
  const next = () => {
   goto('/inventory?page=4') 
  };


</script>

<Table divClass="overflow-hidden">
  <TableHead>
    <TableHeadCell>Product Name</TableHeadCell>
    <TableHeadCell>Category</TableHeadCell>
    <TableHeadCell>Inventory</TableHeadCell>
    <TableHeadCell>Price</TableHeadCell>
    <TableHeadCell>Size</TableHeadCell>
    <TableHeadCell>ABV</TableHeadCell>
  </TableHead>
  <TableBody tableBodyClass="divide-y">
    {#each products as product, i}
      <TableBodyRow on:click={() => toggleRow(i)}>
        <TableBodyCell>{product.productName}</TableBodyCell>
        <TableBodyCell>{product.categoryName}</TableBodyCell>
        <TableBodyCell>
          <span class="flex items-center">
            {#if product.productInStockQuantity > 0}
              <Indicator size="sm" color="green" class="me-1.5" />In stock
            {:else}
              <Indicator size="sm" color="red" class="me-1.5" />Out of stock
            {/if}
          </span>
        </TableBodyCell>
        <TableBodyCell>{USDollar.format(product.productPricePerUnit)}</TableBodyCell>
        <TableBodyCell>{parseSize(product.productUnitSizeInMilliliters)}</TableBodyCell>
        <TableBodyCell>{product.productProof === 0? 'N/A' : `${product.productProof / 2}%`}</TableBodyCell>

      </TableBodyRow>
      {#if openRow === i}
        <TableBodyRow on:dblclick={() => {
          // console.log('fsdf')
          // doubleClickModal = true;
          // details = product;
        }}>
          <TableBodyCell colspan="6" class="p-0">
            <div class="px-2 py-3" transition:slide={{ duration: 300, axis: 'y' }}>
              <InventoryItem {product}></InventoryItem>
            </div>
          </TableBodyCell>
        </TableBodyRow>
      {/if}
    {/each}
  </TableBody>

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
</Table>
<Modal title={details?.name} bind:open={doubleClickModal} autoclose outsideclose>
  <ImagePlaceholder />
</Modal>