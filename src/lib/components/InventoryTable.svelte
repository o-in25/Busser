
<!-- TODO dispatch and handle in page file -->
<script lang="ts">
	import type {PaginationData, Product} from '$lib/types';
	import {
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell,
		Indicator,
		Pagination,
		Alert,
		Input,
		Label,
		Progressbar,
		Badge,
		Button,
		InputAddon,
		ButtonGroup,
		P,
	} from 'flowbite-svelte';
	import {
		ChevronLeftOutline,
		ChevronRightOutline,
		InfoCircleSolid,
		PlusOutline,
		SearchOutline,
	} from 'flowbite-svelte-icons';

	import {slide} from 'svelte/transition';
	import {page} from '$app/stores';
	import {goto} from '$app/navigation';
	import InventoryItem from './InventoryItem.svelte';
	export let products: Product[];
	export let paginationData: PaginationData;

	let openRow: number | null;
	// let details: { name: any; }
	// let doubleClickModal = false

	const rowControl = (row: number) => (openRow = openRow === row ? null : row);

	const paginate = ({total, perPage}) => {
      // apply here

		let range = Math.ceil(total / perPage);
		return [...Array(range)]
			.map((_, index) => index + 1)
			.map(page => page.toString())
			.map((page) => {
        // ive tried doing this so many other ways

        let href = `/inventory?page=${page}`;
        if(searchTerm) {
          href += `&productName=${searchTerm}`;
        }
        // if(searchTerm)
        return {
          name: page,
          href,
          active: false,
        }
			});
	};

	$: search = products;
	// $: search = products.filter(({ productName }) => productName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1);
	$: activeUrl = $page.url.searchParams.get('page');
	$: pages = paginate(paginationData);

  // trying new naming for reactive expressions
  $: urlParams_$ = $page.url.searchParams;
  let searchTerm = $page.url.searchParams.get('productName') || '';

  let form: HTMLFormElement;
	$: {
		if (!activeUrl) {
			const [first] = pages;
      if(first) {
        first.active = true;
      }
		} else {
			pages?.forEach(page => {
				let queryString = page.href.split('?').slice(1).join('?');
				const params = new URLSearchParams(queryString);
				page.active = params.get('page') === activeUrl;
			});
			pages = pages;
		}
	}

  const navigate = (route: string, page: string | number) => {
    const urlParams = new URLSearchParams();
    urlParams.set('page', page.toString())
    urlParams_$.entries().forEach(([key, value]) => {
      if(key !== 'page') {
        urlParams.set(key, value)
      }
    })
    goto(`/${route}?${urlParams.toString()}`);
  }


</script>

<form action="/inventory" method="GET" on:submit|preventDefault={() => {
  let url = '/inventory';
  if(searchTerm !== '') {
    url = url.concat('?', `productName=${searchTerm}`)
    url = url.concat('&', `page=1`)
  } else {
    url = url.concat('?', `page=1`)
  }

  console.log(url)
  goto(url, { replaceState: true, invalidateAll: true });

}} bind:this={form}>
  <div class="flex justify-between">
    <!-- search -->
    <Label class="space-y-2 space-x-4 mb-6">
      <ButtonGroup>
        <Input size="md" name="productName" type="text" bind:value={searchTerm} class="w-1/2 md:w-full"/>
        <Button color="primary" type="submit">Search</Button>
      </ButtonGroup>
    </Label>
  
  
    <!-- dropdown -->
    <div>
      <Button
        color="alternative"
        href="/inventory/add">
        <PlusOutline class="w-6 h-6 " />
      </Button>
    </div>
  </div>
  <!-- table -->
  <Table
    divClass="relative overflow-x-auto rounded-lg"
    hoverable={true}>
    <!-- head -->
    <TableHead>
      <TableHeadCell>Product Name</TableHeadCell>
      <TableHeadCell class="hidden sm:table-cell">Category</TableHeadCell>
      <TableHeadCell class="hidden sm:table-cell">Status</TableHeadCell>
      <TableHeadCell class="hidden sm:table-cell">Strength</TableHeadCell>
    </TableHead>
  
    <!-- body -->
    <TableBody tableBodyClass="divide-y">
      <!-- rows -->
      {#each search as product, row}
        <TableBodyRow on:click={() => rowControl(row)} class="cursor-pointer">
          <TableBodyCell>{product.productName}</TableBodyCell>
          <TableBodyCell
            tdClass="hidden sm:table-cell sm:px-6 sm:py-4 sm:whitespace-nowrap">
            {product.categoryName}
          </TableBodyCell>
          <TableBodyCell
            tdClass="hidden sm:table-cell sm:px-6 sm:py-4 sm:whitespace-nowrap">
            <span class="flex items-center">
              {#if product.productInStockQuantity < 1}
                <Indicator
                  size="sm"
                  color="red"
                  class="me-1.5" />Out of stock
              {:else}
                <Indicator
                  size="sm"
                  color="green"
                  class="me-1.5" />In stock
              {/if}
            </span>
          </TableBodyCell>
          <TableBodyCell
            tdClass="hidden sm:table-cell sm:px-6 sm:py-4 sm:whitespace-nowrap">
            {#if product.productProof < 1}
              <!-- <Progressbar progress="{product.productProof / 2}" /> -->
              <Badge
                rounded
                color="dark"
                class="w-full h-auto">
                N/A
              </Badge>
            {:else}
              <Progressbar progress={product.productProof / 2} />
            {/if}
          </TableBodyCell>
        </TableBodyRow>
  
        <!-- opened  -->
        {#if openRow === row}
          <TableBodyRow
            class=""
            on:dblclick={() => {
              // doubleClickModal = true;
              // details = product;
            }}>
            <TableBodyCell
              colspan={6}
              class="p-0"
              tdClass="border-b last:border-b-0 bg-white dark:bg-gray-800 dark:border-gray-700">
              <div
                class="px-3 py-3"
                transition:slide={{duration: 300, axis: 'y'}}>
                <InventoryItem {product}></InventoryItem>
              </div>
            </TableBodyCell>
          </TableBodyRow>
        {/if}
      {/each}
    </TableBody>
  </Table>
</form>
  {#if !search.length}
    <div class="flex flex-col items-center py-4">
      <Alert color="dark">
        <InfoCircleSolid
          slot="icon"
          class="w-5 h-5" />
        No Results
      </Alert>
    </div>
  {/if}
{#if search.length}
<div class="flex flex-col items-center justify-center gap-2 p-7">
  <div class="text-sm text-gray-700 dark:text-gray-400">
    Page <span class="font-semibold text-gray-900 dark:text-white">
      {paginationData.from + 1}
    </span>
    of 
    <span class="font-semibold text-gray-900 dark:text-white">
      {paginationData.to}
    </span>
    out of
    <span class="font-semibold text-gray-900 dark:text-white">
      {paginationData.total}
    </span>
    items in inventory
  </div>
  <Pagination
    {pages}
    on:previous={() => navigate('inventory', paginationData.prevPage || paginationData.currentPage)}
    on:next={() => navigate('inventory', paginationData.nextPage || paginationData.currentPage)}
    large>
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

<!-- text-center font-medium focus-within:ring-4 focus-within:outline-none px-5 py-2.5 text-sm rounded-lg inline-flex items-center justify-center w-full !border-0 !rounded-md bg-white !text-gray-900 dark:bg-gray-900 dark:!text-white hover:bg-transparent hover:!text-inherit transition-all duration-75 ease-in group-hover:!bg-opacity-0 group-hover:!text-inherit -->

<style lang="scss">
	.test {
		div {
			background-color: red !important;
		}
	}
</style>
