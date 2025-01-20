<script lang="ts">
  import Breadcrumb from "$lib/components/Breadcrumb.svelte";
  import CatalogTable from "$lib/components/CatalogTable.svelte";
  import FancyButton from "$lib/components/FancyButton.svelte";
  import type { BasicRecipe } from "$lib/types";
  import {
    Button,
    Dropdown,
    DropdownDivider,
    DropdownItem,
    Heading,
    Input,
    Label,
    TabItem,
    Tabs,
  } from "flowbite-svelte";
  import type { PageData } from "./$types";
  import BreadcrumbItem from "$lib/components/BreadcrumbItem.svelte";
  import {
    ChevronDownOutline,
    ChevronRightOutline,
    DotsHorizontalOutline,
    FilterOutline,
    GridOutline,
    HeartOutline,
    PlusOutline,
    SearchOutline,
    UserCircleSolid,
  } from "flowbite-svelte-icons";

  export let data: PageData;
  let recipes: BasicRecipe[] = data.recipes || [];

  let searchField = '';
  let filterField = "all";
  $: filter =
    filterField === "all"
      ? recipes
      : recipes.filter(
          ({ recipeCategoryDescription }) =>
            recipeCategoryDescription === filterField,
        );


  const applyFilter = (searchField, filterField) => {
    let filtered = recipes;
    if(searchField.length) {
      filtered = filtered.filter(({ recipeName }) => recipeName.toLowerCase().includes(searchField.toLowerCase()));
    }

    if(filterField !== 'all') {
      filtered = filtered.filter(
          ({ recipeCategoryDescription }) =>
            recipeCategoryDescription === filterField,
        );
    }

    return filtered;
  }

  $: search = applyFilter(searchField, filterField);
</script>

<Breadcrumb name="Catalog" href="/catalog">
  <BreadcrumbItem name="Browse Catalog"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h2" class="mb-4 flex flex-row justify-between font-extrabold">
  Browse Catalog
</Heading>
<div class="flex justify-between">
  <Label class="space-y-2 mb-6">
    <Input type="email" size="md" placeholder="Search catalog..." bind:value={searchField}>
      <SearchOutline slot="left" class="w-5 h-5" />
    </Input>
  </Label>
  <div class="">
    <Button><ChevronDownOutline
        class="w-6 h-6 text-white dark:text-white" />
    </Button>
    <Dropdown containerClass="min-w-32">
      <DropdownItem href="/catalog/add">
        <span class="flex"><PlusOutline class="me-2"/>Add</span>
      </DropdownItem>
      <DropdownDivider/>
      <DropdownItem class="flex items-center justify-between">
        <span class="flex"><FilterOutline class="me-2"/>Sort...</span>
      </DropdownItem>
      <Dropdown placement="right-start" open={false}>
          <DropdownItem on:click={() => filterField = 'all'}><span class="{filterField === 'all'? 'font-extrabold' : ''}">All</span></DropdownItem>
        <!-- TODO: get this from the db  -->
        {#each [
          'Whiskey',
          'Gin',
          'Vodka',
          'Rum',
          'Brandy',
          'Tequila',
          ] as category
        }
            <DropdownItem on:click={() => filterField = category}><span class="{filterField === category? 'font-extrabold' : ''}">{category}</span></DropdownItem>
        {/each}
      </Dropdown>
    </Dropdown>
  </div>
</div>
<Tabs tabStyle="underline" contentClass="mt-4">
  <TabItem open>
    <div slot="title" class="flex items-center gap-2">
      <GridOutline size="md" />
      All
    </div>
    <CatalogTable recipes={search}></CatalogTable>
  </TabItem>
  <TabItem>
    <div slot="title" class="flex items-center gap-2">
      <HeartOutline size="md" />
      Favorites
    </div>
    <p class="text-sm text-gray-500 dark:text-gray-400">
      <b>Profile:</b>
      Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
      incididunt ut labore et dolore magna aliqua.
    </p>
  </TabItem>
</Tabs>
