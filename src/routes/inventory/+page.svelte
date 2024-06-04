<script lang="ts">
    import { Heading, ImagePlaceholder, Modal, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, TableSearch } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import { slide } from 'svelte/transition';
    
    export let data: PageData;
  let searchTerm = '';

  const items = [
    {
      name: 'Apple MacBook Pro 17"',
      color: "Sliver",
      type: "Laptop",
      price: "$2999",
    },
    {
      name: "Microsoft Surface Pro",
      color: "White",
      type: "Laptop PC",
      price: "$1999",
    },
    {
      name: "Magic Mouse 2",
      color: "Black",
      type: "Accessories",
      price: "$99",
    },
  ];

  let openRow
  let details

  const toggleRow = (i) => {
    openRow = openRow === i ? null : i
  }
  $: filteredItems = items.filter((item) => item.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1);
</script>

<div class="p-4 bg-gray-50 rounded-lg dark:bg-gray-800 mt-4">
  <div class="text-sm text-gray-500 dark:text-gray-400">
      <Heading tag="h4" class="mb-4 flex flex-row justify-between">
          Inventory
      </Heading>
      <p id="test">hello</p>
      <div class="flex justify-left items-center">
        <div class="grow" id="inventory-table">
          <TableSearch placeholder="Search by maker name" hoverable={true} bind:inputValue={searchTerm}>
            <Table divClass="relative overflow-y-hidden">
              <TableHead>
                <TableHeadCell>Product name</TableHeadCell>
                <TableHeadCell>Color</TableHeadCell>
                <TableHeadCell>Category</TableHeadCell>
                <TableHeadCell>Price</TableHeadCell>
              </TableHead>
              <TableBody tableBodyClass="divide-y">
                {#each filteredItems as item, i}
                  <TableBodyRow on:click={() => toggleRow(i)}>
                    <TableBodyCell>{item.name}</TableBodyCell>
                    <TableBodyCell>{item.color}</TableBodyCell>
                    <TableBodyCell>{item.type}</TableBodyCell>
                    <TableBodyCell>{item.price}</TableBodyCell>
                  </TableBodyRow>
                  {#if openRow === i}
                    <TableBodyRow on:dblclick={() => (details = item)}>
                      <TableBodyCell colspan="4" class="p-0">
                        <div class="px-2 py-3" transition:slide={{ duration: 300, axis: 'y' }}>
                          <ImagePlaceholder />
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