<script lang="ts">
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import { Heading } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import { InventoryForm } from '$lib/components/InventoryForm.svelte';
    
    export let data: PageData;
</script>

<Breadcrumb name="Inventory" href="/inventory">
  <BreadcrumbItem name="Add To Inventory"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h4" class="mb-4 flex flex-row justify-between">
  Inventory
</Heading>

<div class="px-4 py-2 md:py-4">
  <InventoryForm action="edit" product={data.args.product} />
</div>