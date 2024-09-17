<script lang="ts">
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import { Heading } from 'flowbite-svelte';
    import type { ActionData, PageData } from './$types';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import InventoryForm from '$lib/components/InventoryForm.svelte';
    
    export let data: PageData;
    export let form: ActionData;
    $: product = form?.args?.product || data.args.product;

</script>

<Breadcrumb name="Inventory" href="/inventory">
  <BreadcrumbItem name="Edit Inventory"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h4" class="mb-4 flex flex-row justify-between">
  Edit {product.productName}
</Heading>

<div class="px-4 py-2 md:py-4">
  {#if form?.success || form?.error}
    <InventoryForm action={'edit'} result="{form}" {product}/>
  {:else}
    <InventoryForm action={'edit'} {product} />
  {/if}
</div>