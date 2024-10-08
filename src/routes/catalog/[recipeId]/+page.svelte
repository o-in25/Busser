<script lang="ts">
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import { Heading } from 'flowbite-svelte';
    import type { PageData } from './$types';
    
    export let data: PageData;
</script>

<Breadcrumb name="Catalog" href="/catalog">
  <BreadcrumbItem name="Browse" href="/catalog/browse"></BreadcrumbItem>
  <BreadcrumbItem name="Browse" href="/catalog/browse"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h2" class="mb-4 font-extrabold flex flex-row justify-between">
  New Catalog Item
</Heading>

<div class="px-4 py-2 md:py-4">
  f
</div>