<script lang="ts">
    import { Heading, Card, Gallery } from 'flowbite-svelte';
    import type { PageData } from './$types';
    import Breadcrumb from '$lib/components/Breadcrumb.svelte';
    import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
    import Catalog from '$lib/components/Catalog.svelte';
    
    export let data: PageData;
</script>

<!-- <Breadcrumb name="Catalog" href="/catalog">
  <BreadcrumbItem name="{data?.spirit?.recipeCategoryDescription}"></BreadcrumbItem>
</Breadcrumb>
<Heading tag="h4" class="mb-4 flex flex-row justify-between">
  {data?.spirit?.recipeCategoryDescription}
</Heading> -->

<!-- <div class="px-4 py-2 md:py-4">
  <div class="space-y-4">
    hello
  </div>
</div> -->

<div class="mt-5">
<Breadcrumb name="Catalog" href="/catalog">
  <BreadcrumbItem name="{data?.spirit?.recipeCategoryDescription}"></BreadcrumbItem>
</Breadcrumb>
<!-- <Heading tag="h4" class="mb-4 flex flex-row justify-between">
  {data?.spirit?.recipeCategoryDescription}
</Heading> -->

<Gallery items={data.images} class="gap-4 grid-cols-2 md:grid-cols-3" />

</div>
<div class="px-4 py-2 md:py-4">
  <div class="space-y-4">
    <Catalog spirit={data.spirit} recipes={data.recipes} content={data.content}/>
  </div>
</div>