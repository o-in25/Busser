<script lang="ts">
    import { Heading } from 'flowbite-svelte';
    import type { ActionData } from './$types';
    import InventoryForm from '$lib/components/InventoryForm.svelte';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    
    // export let data: PageData;
    export let form: ActionData;


</script>

<Breadcrumb name="Inventory" href="/inventory">
  <BreadcrumbItem name="Add To Inventory"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h4" class="mb-4 flex flex-row justify-between">
  Inventory
</Heading>

<div class="px-4 py-2 md:py-4">
  {#if form?.success || form?.error}
    <InventoryForm action={'add'} result="{form}" product={form.args.product}/>
  {:else}
    <InventoryForm action={'add'}/>
  {/if}
</div>