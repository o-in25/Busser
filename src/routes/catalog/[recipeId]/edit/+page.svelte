<script lang="ts">
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import { Heading } from 'flowbite-svelte';
    import type { ActionData, PageData } from './$types';
    import CatalogForm from '$lib/components/CatalogForm.svelte';
    
    export let data: PageData;
    export let form: ActionData;
    
    const { args: { recipe, recipeSteps, spirits, preparationMethods } } = data;
</script>
<svelte:head>
    <title>Edit {recipe.recipeName} - Busser</title> 
</svelte:head>
  <Breadcrumb name="Catalog" href="/catalog">
    <BreadcrumbItem name="Browse Catalog" href="/catalog/browse"></BreadcrumbItem>
    <BreadcrumbItem name="{recipe.recipeName}" href="/catalog/{recipe.recipeId}"></BreadcrumbItem>
    <BreadcrumbItem name="Edit Catalog"></BreadcrumbItem>
  </Breadcrumb>
  <Heading tag="h2" class="mb-4 font-extrabold flex flex-row justify-between">
    Edit {recipe.recipeName}
  </Heading>
  <div class="px-4 py-2 md:py-4">
    <CatalogForm {spirits} {preparationMethods} {recipe} {recipeSteps}/>
  </div>

