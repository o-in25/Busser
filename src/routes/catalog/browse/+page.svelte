<script lang="ts">
  import Breadcrumb from "$lib/components/Breadcrumb.svelte";
  import CatalogTable from "$lib/components/CatalogTable.svelte";
  import FancyButton from "$lib/components/FancyButton.svelte";
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
    Listgroup,
    ListgroupItem,
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
  }

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
      <Button>
        <ChevronDownOutline class="w-6 h-6 text-white dark:text-white" />
      </Button>
      <Dropdown containerClass="min-w-32" bind:open={dropdownOpen}>
        <DropdownItem href="/catalog/add">
          <span class="flex"><PlusOutline class="me-2" />Add</span>
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem class="flex items-center justify-between">
          <span class="flex"><FilterOutline class="me-2" />Sort...</span>
        </DropdownItem>
        <Dropdown placement="right-start" open={false}>
          <DropdownItem on:click={() => handleDropdownOpen('all')} class={filterField === 'all' ? "bg-gray-100 dark:bg-gray-600" : ""}>
                 All

          </DropdownItem>
          <!-- TODO: get this from the db  -->
          {#each ["Whiskey", "Gin", "Vodka", "Rum", "Brandy", "Tequila"] as category}
            <DropdownItem on:click={() => handleDropdownOpen(category)} class={filterField === category ? "bg-gray-100 dark:bg-gray-600" : ""}>
                        {category}

            </DropdownItem>
          {/each}
        </Dropdown>
      </Dropdown>
    </div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-2">
    {#each search as recipe}
      <Card size="xl" padding="sm">
        <div class="flex justify-center">
          <div class="p-4 m-auto">
            <Avatar
              src={recipe.recipeImageUrl || ""}
              alt={recipe.recipeDescription || ""}
              class="" />
          </div>
          <div class="flex-1">
            <h3 class="text-lg font-bold">{recipe.recipeName}</h3>
            <p class="text-sm text-gray-600">
              {recipe.recipeCategoryDescription}
            </p>
            <p class="text-sm text-gray-500 line-clamp-2">{recipe.recipeDescription}</p>
          </div>
        </div>
      </Card>
    {/each}
  </div>
</div>
<!-- <CatalogTable recipes={search}></CatalogTable> -->
