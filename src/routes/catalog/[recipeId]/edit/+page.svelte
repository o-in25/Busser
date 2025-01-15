<script lang="ts">
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import { Heading, Toast } from 'flowbite-svelte';
    import type { ActionData, PageData } from './$types';
    import CatalogForm from '$lib/components/CatalogForm.svelte';
    import { DownloadOutline } from 'flowbite-svelte-icons';
  import { fly } from 'svelte/transition';
    import { notificationStore } from '../../../../stores';

    export let data: PageData;
    export let form: ActionData;
    const { args: { recipe, recipeSteps, spirits, preparationMethods } } = data;

    console.log(form?.success)

      $: result = form;

      const handleSubmit = ({ detail }) => {
        console.log(detail)

      }

</script>

  <Breadcrumb name="Catalog" href="/catalog">
    <BreadcrumbItem name="Browse Catalog" href="/catalog/browse"></BreadcrumbItem>
    <BreadcrumbItem name="{recipe.recipeName}" href="/catalog/{recipe.recipeId}"></BreadcrumbItem>
    <BreadcrumbItem name="Edit"></BreadcrumbItem>
  </Breadcrumb>
  <Heading tag="h2" class="mb-4 font-extrabold flex flex-row justify-between">
    <!-- Edit {recipe.recipeName} -->
  </Heading>

  {result}

  <div class="px-4 py-2 md:py-4">
    <CatalogForm {spirits} {preparationMethods} {recipe} {recipeSteps}/>

  </div>

