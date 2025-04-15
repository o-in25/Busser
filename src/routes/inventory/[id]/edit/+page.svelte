<script lang="ts">
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import { Heading } from 'flowbite-svelte';
    import type { ActionData, PageData } from './$types';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import InventoryForm from '$lib/components/InventoryForm.svelte';
    
    let { data }: { data: PageData } = $props();


</script>
<svelte:head>
    <title>Edit {data.product.productName} - Busser</title> 
</svelte:head>
<Breadcrumb name="Inventory" href="/inventory">
  <BreadcrumbItem name="Edit Inventory"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h2" class="mb-4 flex flex-row justify-between font-extrabold">
  Edit {data.product.productName}
</Heading>

<div class="px-4 py-2 md:py-4">
  <InventoryForm action={'edit'} product={data.product} />
</div>