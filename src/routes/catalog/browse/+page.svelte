<script lang="ts">
  import Breadcrumb from "$lib/components/Breadcrumb.svelte";
  import CatalogTable from "$lib/components/CatalogTable.svelte";
  import FancyButton from "$lib/components/FancyButton.svelte";
  import type { BasicRecipe } from "$lib/types";
  import { Heading } from "flowbite-svelte";
  import type { PageData } from "./$types";
  import BreadcrumbItem from "$lib/components/BreadcrumbItem.svelte";

  export let data: PageData;
  let recipes: BasicRecipe[] = data.recipes;
</script>

<Breadcrumb name="Catalog" href="/catalog">
  <BreadcrumbItem name="Browse Catalog"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h2" class="mb-4 flex flex-row justify-between font-extrabold">
  Browse Catalog
</Heading>
<div class="p-4">
  <FancyButton href="/catalog/add">Add New</FancyButton>
</div>

<CatalogTable {recipes}></CatalogTable>
