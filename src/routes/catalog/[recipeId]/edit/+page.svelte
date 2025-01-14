<script lang="ts">
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import { Heading } from 'flowbite-svelte';
    import type { PageData } from './$types';

    export let data: PageData;
    const { result } = data;
    if('data' in result) {
      console.log(result.data)
    }
</script>

{#if 'data' in result && result.data?.recipe}
  <Breadcrumb name="Catalog" href="/catalog">
    <BreadcrumbItem name="Browse Catalog" href="/catalog/browse"></BreadcrumbItem>
    <BreadcrumbItem name="{result.data.recipe.recipeName}" href="/catalog/1"></BreadcrumbItem>
    <BreadcrumbItem name="Edit"></BreadcrumbItem>
  </Breadcrumb>
  <Heading tag="h2" class="mb-4 font-extrabold flex flex-row justify-between">
    Edit {result.data.recipe.recipeName}
  </Heading>

  {result.data.recipe}

  <div class="px-4 py-2 md:py-4">
    <!-- {#if 'data' in result}
      <CatalogItem {recipe} {recipeSteps}></CatalogItem>
    {/if} -->
  </div>
{/if}
