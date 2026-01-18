<script lang="ts">
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';

	import type { PageData } from './$types';
	import CatalogForm from '$lib/components/CatalogForm.svelte';

	export let data: PageData;
</script>

<svelte:head>
	<title>New Catalog Item - Busser</title>
</svelte:head>
<Breadcrumb
	name="Catalog"
	href="/catalog"
>
	<BreadcrumbItem name="Add"></BreadcrumbItem>
</Breadcrumb>
<h2 class="text-3xl font-extrabold mb-4 flex flex-row justify-between">
	New Catalog Item
</h2>

<div class="md:px-2 md:p py-2 md:py-4">
	<CatalogForm
		spirits={data.args.spirits}
		preparationMethods={data.args.preparationMethods}
	/>
</div>
