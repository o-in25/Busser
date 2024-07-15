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
    Pagination,
    TableSearch,
    Alert,

    Button

  } from 'flowbite-svelte';
  import { ChevronLeftOutline, ChevronRightOutline, InfoCircleSolid } from 'flowbite-svelte-icons';
  import { slide } from 'svelte/transition';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import InventoryItem from './InventoryItem.svelte';

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

</script>

<Table divClass="overflow-hidden">
  <TableSearch placeholder="Search" hoverable={true} bind:inputValue={searchTerm}>
    <TableHead>
      <TableHeadCell>Product Name</TableHeadCell>
      <TableHeadCell>Category</TableHeadCell>
      <TableHeadCell>Inventory</TableHeadCell>
      <TableHeadCell>Price</TableHeadCell>
      <TableHeadCell>Size</TableHeadCell>
      <TableHeadCell>ABV</TableHeadCell>
    </TableHead>
    <TableBody tableBodyClass="divide-y">
      {#each search as product, row}
        <TableBodyRow on:click={() => rowControl(row)}>
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
          <TableBodyCell>{money.format(product.productPricePerUnit)}</TableBodyCell>
          <TableBodyCell>{parseSize(product.productUnitSizeInMilliliters)}</TableBodyCell>
          <TableBodyCell>{product.productProof === 0? 'N/A' : `${product.productProof / 2}%`}</TableBodyCell>

        </TableBodyRow>
        {#if openRow === row}
          <TableBodyRow on:dblclick={() => {
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
  </TableSearch>
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
{#if searchTerm === '' }
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