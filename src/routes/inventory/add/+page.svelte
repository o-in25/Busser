<script lang="ts">
    import { Heading, P } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import { AngleRightOutline } from 'flowbite-svelte-icons';
    import InventoryForm from '$lib/components/InventoryForm.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    
    export let data: PageData;
</script>

<Breadcrumb name="Inventory" href="/inventory">
  <BreadcrumbItem name="Add To Inventory"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h4" class="mb-4 flex flex-row justify-between">
  Inventory
</Heading>

<div class="px-4 py-2 md:py-4">
  <InventoryForm action={'add'}/>
</div>