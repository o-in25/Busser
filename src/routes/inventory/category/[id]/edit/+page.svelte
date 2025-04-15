<script lang="ts">
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import { Heading } from 'flowbite-svelte';
    import type { PageData } from './$types';
	import CategoryForm from '$lib/components/CategoryForm.svelte';

    let { data }: { data: PageData } = $props();
</script>
<svelte:head>
    <title>Edit {data.category?.categoryName} - Busser</title> 
</svelte:head>
<Breadcrumb name="Inventory" href="/inventory">
  <!-- <BreadcrumbItem name="Add To Inventory" href="/inventory/add"></BreadcrumbItem> -->
  <BreadcrumbItem name="Edit Category"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h2" class="mb-4 flex font-extrabold flex-row justify-between">
  Edit {data.category?.categoryName}
</Heading>

<div class="px-4 py-2 md:py-4">
  <CategoryForm category={data.category}/>

</div>