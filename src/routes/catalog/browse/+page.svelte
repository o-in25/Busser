<script lang="ts">
  import Breadcrumb from "$lib/components/Breadcrumb.svelte";
  import type { BasicRecipe } from "$lib/types";
  import {
    Avatar,
    Button,
    Card,
    Dropdown,
    DropdownDivider,
    DropdownItem,
    Heading,
    Input,
    Label,
  } from "flowbite-svelte";
  import type { PageData } from "./$types";
  import BreadcrumbItem from "$lib/components/BreadcrumbItem.svelte";
  import {
    ChevronDownOutline,
    FilterOutline,
    PlusOutline,
    SearchOutline,
  } from "flowbite-svelte-icons";
  // import placeholder from "$lib/assets/placeholder@2x.jpg";

  import placeholderLight from  "$lib/assets/placeholder-alt-light.png";
  import placeholderDark from  "$lib/assets/placeholder-alt-dark.png";
    import CatalogItem from "$lib/components/CatalogItem.svelte";

  export let data: PageData;
  let recipes: BasicRecipe[] = data.recipes || [];
  let baseSpirits: string[] = data.baseSpirits || [];

  let searchField = "";
  let filterField = "all";
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
      filtered = filtered.filter(({ recipeName }) =>
        recipeName.toLowerCase().includes(searchField.toLowerCase()),
      );
    }

    if (filterField !== "all") {
      filtered = filtered.filter(
        ({ recipeCategoryDescription }) =>
          recipeCategoryDescription === filterField,
      );
    }

    return filtered;
  };

  const handleDropdownOpen = (category: string) => {
    filterField = category;
    dropdownOpen = false;
  };

  $: search = applyFilter(searchField, filterField);
</script>

<Breadcrumb name="Catalog" href="/catalog">
  <BreadcrumbItem name="Browse Catalog"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h2" class="mb-4 flex flex-row justify-between font-extrabold">
  Browse Catalog
</Heading>
<div class="px-4 py-2 md:py-4">
  <div class="flex justify-between">
    <!-- search -->
    <Label class="space-y-2 mb-6">
      <Input
        type="email"
        size="md"
        placeholder="Search catalog..."
        bind:value={searchField}>
        <SearchOutline slot="left" class="w-5 h-5" />
      </Input>
    </Label>

    <!-- dropdown -->
    <div>
      <Button color="alternative">
        <ChevronDownOutline class="w-6 h-6 " />
      </Button>

      <!-- controls -->
      <Dropdown
        bind:open={dropdownOpen}
        placement="bottom">
        <DropdownItem href="/catalog/add">
          <span class="flex"><PlusOutline class="me-2" />Add</span>
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem class="flex items-center justify-between">
          <span class="flex"><FilterOutline class="me-2" />Sort...</span>
        </DropdownItem>

        <!-- filter -->
        <Dropdown placement="bottom-start" open={false}>
          <DropdownItem
            on:click={() => handleDropdownOpen("all")}
            class={filterField === "all" ? "bg-gray-100 dark:bg-gray-600" : ""}>
            All
          </DropdownItem>
          <!-- TODO: get this from the db  -->
          {#each baseSpirits as baseSpirit}
            <DropdownItem
              on:click={() => handleDropdownOpen(baseSpirit)}
              class={filterField === baseSpirit
                ? "bg-gray-100 dark:bg-gray-600"
                : ""}>
              {baseSpirit}
            </DropdownItem>
          {/each}
        </Dropdown>
      </Dropdown>
    </div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
    {#each search as recipe}
      <CatalogItem {recipe}/>
    {/each}
  </div>
</div>
<!-- <CatalogTable recipes={search}></CatalogTable> -->
