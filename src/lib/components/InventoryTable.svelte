<!-- TODO dispatch and handle in page file -->
<script lang="ts">
	import type { PaginationData, Product, Spirit } from '$lib/types';
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
		Progressbar,
		Badge,
		Button,
		Search,
		Dropdown,
		DropdownItem,
	} from 'flowbite-svelte';
	import {
	CheckOutline,
		ChevronDownOutline,
		ChevronLeftOutline,
		ChevronRightOutline,
		CloseCircleSolid,
		FilterOutline,
		InfoCircleSolid,
		PlusOutline,
	} from 'flowbite-svelte-icons';
	import { getContext } from 'svelte';
	import { slide } from 'svelte/transition';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import InventoryItem from './InventoryItem.svelte';

	export let products: Product[];
	export let paginationData: PaginationData;
  export let tableData: Spirit[];
	const permissions: string[] = getContext('permissions');

	let openRow: number | null;
	let openDropdown: boolean = false;
	// let details: { name: any; }
	// let doubleClickModal = false

	const rowControl = (row: number) => (openRow = openRow === row ? null : row);

	const paginate = ({ total, perPage }) => {
		// apply here

		let range = Math.ceil(total / perPage);
		return [...Array(range)]
			.map((_, index) => index + 1)
			.map(page => page.toString())
			.map(page => {
				// ive tried doing this so many other ways

				let href = `/inventory?page=${page}`;
				if (searchTerm) {
					href += `&productName=${searchTerm}`;
				}
				// if(searchTerm)
				return {
					name: page,
					href,
					active: false,
				};
			});
	};

	$: search = products;
	// $: search = products.filter(({ productName }) => productName.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1);
	$: activeUrl = $page.url.searchParams.get('page');
	$: pages = paginate(paginationData);

	// trying new naming for reactive expressions
	$: urlParams_$ = $page.url.searchParams;
	let searchTerm = $page.url.searchParams.get('productName') || '';
	let direction: 'asc' | 'desc' | null;
	let form: HTMLFormElement;
  const regex = new RegExp(`\\b(${tableData.map(({ recipeCategoryDescription }) => recipeCategoryDescription.toLowerCase()).join('|')})\\b`, 'i');
	$: {
		if (!activeUrl) {
			const [first] = pages;
			if (first) {
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
		urlParams.set('page', page.toString());
		urlParams_$.entries().forEach(([key, value]) => {
			if (key !== 'page') {
				urlParams.set(key, value);
			}
		});
		goto(`/${route}?${urlParams.toString()}`);
	};

	const isBaseSpirit = (categoryName: string) => regex.test(categoryName);
</script>

<form
	action="/inventory"
	method="GET"
	on:submit|preventDefault={() => {
		let url = '/inventory';
		if (searchTerm !== '') {
			url = url.concat('?', `productName=${searchTerm}`);
			url = url.concat('&', `page=1`);
		} else {
			url = url.concat('?', `page=1`);
		}
		openRow = null;
		searchTerm = searchTerm;
		goto(url, { replaceState: true, invalidateAll: true });
	}}
	bind:this={form}
>
	<div class="flex my-2">
		<div class="relative">
			<Button
				color="light"
				class="rounded-e-none whitespace-nowrap border border-e-0 bg-gray-50 dark:bg-gray-700"
			>
				<FilterOutline class="w-5 h-5" />
				<ChevronDownOutline class="w-5 h-5" />
			</Button>
			<Dropdown
				classContainer="w-40 backdrop-blur-md bg-zinc-200/50 dark:bg-zinc-900/30 border border-zinc-300/30 dark:border-zinc-700/40 shadow-lg rounded-xl p-4"
				bind:open={openDropdown}
				activeUrl={'/inventory'}
			>
				<div
					slot="header"
					class="px-4 py-2"
				>
					<span class="block text-sm text-gray-900 dark:text-white">
						Sort By...
					</span>
				</div>
				<DropdownItem
					href="/inventory"
					on:click={() => (openDropdown = false)}
					class="w-full text-left px-4 py-2 rounded-lg transition-colors hover:bg-primary-500/10 focus:bg-primary-500/20 dark:hover:bg-primary-500/20 dark:focus:bg-primary-500/30"
					activeClass="bg-primary-500/20 dark:bg-primary-500/30"
				>
					All
				</DropdownItem>
				<DropdownItem
					href="/inventory?productInStockQuantity=0"
					on:click={() => (openDropdown = false)}
					class="w-full text-left px-4 py-2 rounded-lg transition-colors hover:bg-primary-500/10 focus:bg-primary-500/20 dark:hover:bg-primary-500/20 dark:focus:bg-primary-500/30"
					activeClass="bg-primary-500/20 dark:bg-primary-500/30"
				>
					Out of Stock
				</DropdownItem>
				<DropdownItem
					href="/inventory?productInStockQuantity=1"
					on:click={() => (openDropdown = false)}
					class="w-full text-left px-4 py-2 rounded-lg transition-colors hover:bg-primary-500/10 focus:bg-primary-500/20 dark:hover:bg-primary-500/20 dark:focus:bg-primary-500/30"
					activeClass="bg-primary-500/20 dark:bg-primary-500/30"
				>
					In Stock
				</DropdownItem>
			</Dropdown>
		</div>

		<Search
			size="md"
			class="flex gap-2 items-center py-2.5 {permissions.includes(
				'edit_inventory'
			)
				? 'rounded-none'
				: 'rounded-s-none'}"
			placeholder="Search..."
			bind:value={searchTerm}
		>
			{#if searchTerm}
				<button
					type="button"
					on:click={() => {
						searchTerm = '';
						goto('/inventory', { replaceState: true });
					}}
					class="outline-hidden"
				>
					<CloseCircleSolid class="w-5 h-5 me-2" />
				</button>
			{/if}
		</Search>
		{#if permissions.includes('add_inventory')}
			<Button
				class="p-2.5! rounded-s-none"
				href="/inventory/add"
			>
				<PlusOutline class="w-5 h-5" />
			</Button>
		{/if}
	</div>
	<!-- table -->

	<Table
		divClass="relative overflow-x-auto rounded-lg"
		hoverable={true}
	>
		<!-- head -->
		<TableHead>
			<TableHeadCell
				bind:direction
				class="hidden sm:table-cell"
			>
				Name
			</TableHeadCell>
			<TableHeadCell
				bind:direction
				class="hidden sm:table-cell"
			>
				Category
			</TableHeadCell>
			<TableHeadCell
				bind:direction
				class="hidden sm:table-cell"
			>
				Status
			</TableHeadCell>
			<TableHeadCell class="hidden sm:table-cell text-center">Base Spirit</TableHeadCell>
		</TableHead>

		<!-- body -->
		<TableBody tableBodyClass="divide-y">
			<!-- rows -->
			{#each search as product, row}
				<TableBodyRow
					on:click={() => rowControl(row)}
					class="cursor-pointer"
				>
					<TableBodyCell>{product.productName}</TableBodyCell>
					<TableBodyCell
						tdClass="hidden sm:table-cell sm:px-6 sm:py-4 sm:whitespace-nowrap"
					>
						{product.categoryName}
					</TableBodyCell>
					<TableBodyCell
						tdClass="hidden sm:table-cell sm:px-6 sm:py-4 sm:whitespace-nowrap"
					>
						<span class="flex items-center">
							{#if product.productInStockQuantity < 1}
								<Indicator
									size="sm"
									color="red"
									class="me-1.5"
								/>Out of stock
							{:else}
								<Indicator
									size="sm"
									color="green"
									class="me-1.5"
								/>In stock
							{/if}
						</span>
					</TableBodyCell>
					<TableBodyCell
						tdClass="hidden sm:table-cell sm:px-6 sm:py-4 sm:whitespace-nowrap"
					>
          {#if isBaseSpirit(product.categoryName)}
          <div class="flex">
            <Badge rounded large class="!p-1 !font-semibold !mx-auto">
              <CheckOutline class="h-3 w-3 text-primary-800 dark:text-primary-400" />
              <span class="sr-only">Icon description</span>
            </Badge>
          </div> 
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
						}}
					>
						<TableBodyCell
							colspan={6}
							class="p-0"
							tdClass="border-b last:border-b-0 bg-white dark:bg-gray-800 dark:border-gray-700"
						>
							<div
								class="px-3 py-3"
								transition:slide={{ duration: 300, axis: 'y' }}
							>
								<InventoryItem {product} isBaseSpirit={isBaseSpirit(product.categoryName)}></InventoryItem>
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
				class="w-5 h-5"
			/>
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
			on:previous={() =>
				navigate(
					'inventory',
					paginationData.prevPage || paginationData.currentPage
				)}
			on:next={() =>
				navigate(
					'inventory',
					paginationData.nextPage || paginationData.currentPage
				)}
			large
		>
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
