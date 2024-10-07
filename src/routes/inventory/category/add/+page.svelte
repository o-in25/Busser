<script lang="ts">
    import InventoryTable from '$lib/components/InventoryTable.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import { Heading, P, Span } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import CategoryForm from '$lib/components/CategoryForm.svelte';
    
    export let data: PageData;
</script>
<Breadcrumb name="Inventory" href="/inventory">
  <BreadcrumbItem name="Add To Inventory" href="/inventory/add"></BreadcrumbItem>
  <BreadcrumbItem name="Add Category"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h2" class="mb-4 flex font-extrabold flex-row justify-between">
  New Category
</Heading>

<div class="px-4 py-2 md:py-4">
  <CategoryForm/>
</div>