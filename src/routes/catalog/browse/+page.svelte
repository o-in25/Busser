<script lang="ts">
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import type {View} from '$lib/types';
	import {
		Button,
		Dropdown,
		DropdownItem,
		Heading,
		Search,
	} from 'flowbite-svelte';
	import type {PageData} from './$types';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import {
		ChevronDownOutline,
		CloseCircleSolid,
		FilterOutline,
		PlusOutline,
	} from 'flowbite-svelte-icons';
	// import placeholder from "$lib/assets/placeholder@2x.jpg";

	import CatalogItem from '$lib/components/CatalogItem.svelte';
	import {getContext} from 'svelte';
	import {page} from '$app/stores';
	import {goto} from '$app/navigation';
	import {LoaderState} from 'svelte-infinite';
	import { enhance } from '$app/forms';

	export let data: PageData;
	let recipes: View.BasicRecipe[] = data.searchResult;
	// let baseSpirits: View.BasicRecipeCategory[] = data.baseSpirits || [];
	const permissions: string[] = getContext('permissions');
	let openDropdown: boolean = false;

	let searchField = '';
	let filterField = 'all';
	let dropdownOpen = false;

	// $: filter =
	//   filterField === "all"
	//     ? recipes
	//     : recipes.filter(
	//         ({ recipeCategoryDescription }) =>
	//           recipeCategoryDescription === filterField,
	//       );

	const applyFilter = (searchField, filterField) => {
		let filtered = recipes;
		if (searchField.length) {
			filtered = filtered.filter(({recipeName}) =>
				recipeName.toLowerCase().includes(searchField.toLowerCase())
			);
		}

		if (filterField !== 'all') {
			filtered = filtered.filter(
				({recipeCategoryDescription}) =>
					recipeCategoryDescription === filterField
			);
		}

		return filtered;
	};

	let searchTerm = $page.url.searchParams.get('searchTerm') || '';

	const handleDropdownOpen = (category: string) => {
		filterField = category;
		dropdownOpen = false;
	};

	$: search = applyFilter(searchField, filterField);
  // const searchParams = new URLSearchParams({limit, skip});

//   on:submit|preventDefault={() => {
//   // let url = '/inventory';
//   // if (searchTerm !== '') {
//   //   url = url.concat('?', `productName=${searchTerm}`);
//   //   url = url.concat('&', `page=1`);
//   // } else {
//   //   url = url.concat('?', `page=1`);
//   // }
//   // searchTerm = searchTerm;
//   // goto(url, {replaceState: true, invalidateAll: true});
// }}
</script>

<Breadcrumb
	name="Catalog"
	href="/catalog">
	<BreadcrumbItem name="Browse Catalog"></BreadcrumbItem>
</Breadcrumb>
<Heading
	tag="h2"
	class="mb-4 flex flex-row justify-between font-extrabold">
	Browse Catalog
</Heading>
<form method="GET" use:enhance data-sveltekit-reload>
  <div class="px-4 py-2 md:py-4">
    <div class="flex my-2">
      <div class="relative">
        <Button
          color="light"
          class="rounded-e-none whitespace-nowrap border border-e-0 border-primary-700">
          <FilterOutline class="w-5 h-5" />
          <ChevronDownOutline class="w-5 h-5" />
        </Button>
        <Dropdown
          classContainer="w-40"
          bind:open={openDropdown}>
          <div
            slot="header"
            class="px-4 py-2">
            <span class="block text-sm text-gray-900 dark:text-white">
              Sort By...
            </span>
          </div>
          <DropdownItem
            href="/inventory"
            on:click={() => (openDropdown = false)}>
            All
          </DropdownItem>
          <DropdownItem
            href="/inventory?productInStockQuantity=0"
            on:click={() => (openDropdown = false)}>
            Out of Stock
          </DropdownItem>
          <DropdownItem
            href="/inventory?productInStockQuantity=1"
            on:click={() => (openDropdown = false)}>
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
        name="searchTerm"
        bind:value={searchTerm}>
        {#if searchTerm}
          <button
            type="button"
            on:click={() => {
              searchTerm = '';
              goto('/catalog/browse', {replaceState: false});
            }}
            class="outline-hidden">
            <CloseCircleSolid class="w-5 h-5 me-2" />
          </button>
        {/if}
      </Search>
      {#if permissions.includes('add_inventory')}
        <Button
          class="p-2.5! rounded-s-none"
          href="/catalog/add">
          <PlusOutline class="w-5 h-5" />
        </Button>
      {/if}
    </div>
  
    <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
      {#each search as recipe}
        <CatalogItem {recipe} />
      {/each}
    </div>
  </div>
</form>
<!-- <CatalogTable recipes={search}></CatalogTable> -->
