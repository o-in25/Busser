<script lang="ts">
    import { AdvancedRating, Card, Heading, ImagePlaceholder, Modal, P, Rating, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import { slide } from 'svelte/transition';
    import type { Product } from '$lib/types';
    
    export let data: PageData;
  let searchTerm = '';

  const items: Product[] = data.args;

  let openRow
  let details

  const toggleRow = (i) => {
    openRow = openRow === i ? null : i
  }
  $: filteredItems = items;//items.filter((item) => item.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1);
</script>

<div class="p-4 bg-gray-50 rounded-lg dark:bg-gray-800 mt-4">
  <div class="text-sm text-gray-500 dark:text-gray-400">
      <Heading tag="h4" class="mb-4 flex flex-row justify-between">
          Inventory
      </Heading>
      <div>
        <div id="inventory-table">
          <TableSearch placeholder="Search by maker name" hoverable={true} bind:inputValue={searchTerm}>
            <Table>
              <TableHead>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Category</TableHeadCell>
                <TableHeadCell>Proof</TableHeadCell>
                <TableHeadCell>Quantity</TableHeadCell>
              </TableHead>
              <TableBody tableBodyClass="divide-y">
                {#each filteredItems as item, i}
                  <TableBodyRow on:click={() => toggleRow(i)}>
                    <TableBodyCell>{item.productName}</TableBodyCell>
                    <TableBodyCell>{item.categoryName}</TableBodyCell>
                    <TableBodyCell>{item.productProof}</TableBodyCell>
                    <TableBodyCell>{item.productInStockQuantity}</TableBodyCell>
                  </TableBodyRow>
                  {#if openRow === i}
                    <TableBodyRow on:dblclick={() => (details = item)}>
                      <TableBodyCell colspan="4" class="p-0">
                        <div class="px-2 py-3 space-y-4 flex flex-row" transition:slide={{ duration: 300, axis: 'y' }}>
                          <img class="object-contain h-48 w-96 rounded-lg" src={item.productImageUrl}>
                          <div>
                            <P weight="light" color="text-gray-500 dark:text-gray-400">{item.categoryDescription}</P>
                          </div>
                        </div>
                      </TableBodyCell>
                    </TableBodyRow>
                  {/if}
                {/each}
              </TableBody>
            </Table>
            <Modal title={details?.name} open={!!details} autoclose outsideclose>
              <ImagePlaceholder />
            </Modal>
          </TableSearch>
        </div>
      </div>
    </div>
</div>

<style lang="scss">

</style>