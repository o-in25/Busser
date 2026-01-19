<script lang="ts">
	import type { PageData } from './$types';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import Catalog from '$lib/components/Catalog.svelte';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data?.spirit?.recipeCategoryDescription} - Busser</title>
</svelte:head>
<Breadcrumb
	name="Catalog"
	href="/catalog"
>
<BreadcrumbItem name="Browse" href="/catalog/browse"/>
	<BreadcrumbItem name={data?.spirit?.recipeCategoryDescription}
	></BreadcrumbItem>
</Breadcrumb>
<h2 class="text-3xl mb-4 flex flex-row justify-between font-extrabold">
	{data?.spirit?.recipeCategoryDescription}
</h2>

<div class="md:px-4 py-2 md:py-4">
	<div class="space-y-4">
		{#if data.spirit && data.recipes}
			<Catalog
				spirit={data.spirit}
				recipes={data.recipes}
			/>
		{/if}
	</div>
</div>
