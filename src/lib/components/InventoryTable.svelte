<script lang="ts">
  import type { Product } from '$lib/types';
  import {
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    ImagePlaceholder,
    Modal,
    Indicator
  } from 'flowbite-svelte';
  import { slide } from 'svelte/transition';
  import InventoryItem from './InventoryItem.svelte';

  // const items = [
  //   {
  //     name: 'Apple MacBook Pro 17"',
  //     color: "Sliver",
  //     type: "Laptop",
  //     price: "$2999",
  //   },
  //   {
  //     name: "Microsoft Surface Pro",
  //     color: "White",
  //     type: "Laptop PC",
  //     price: "$1999",
  //   },
  //   {
  //     name: "Magic Mouse 2",
  //     color: "Black",
  //     type: "Accessories",
  //     price: "$99",
  //   },
  // ];

  export let products: Product[];
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
</Table>
<Modal title={details?.name} bind:open={doubleClickModal} autoclose outsideclose>
  <ImagePlaceholder />
</Modal>