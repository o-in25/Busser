<script lang="ts">
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
        import Breadcrumb from '$lib/components/Breadcrumb.svelte';

    import type { PageData } from './$types';
    import { Heading } from 'flowbite-svelte';
    import CatalogForm from '$lib/components/CatalogForm.svelte';
    
    export let data: PageData;
</script>

<Breadcrumb name="Catalog" href="/inventory">
  <BreadcrumbItem name="Add To Catalog"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h4" class="mb-4 flex flex-row justify-between">
  New Catalog Item
</Heading>

<div class="px-4 py-2 md:py-4">
  <CatalogForm spirits={data.args.spirits}/>
</div>