<script lang="ts">
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import type { PageData } from './$types';
	import CategoryForm from '$lib/components/CategoryForm.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Edit {data.category?.categoryName} - Busser</title>
</svelte:head>
<Breadcrumb
	name="Inventory"
	href="/inventory"
>
	<!-- <BreadcrumbItem name="Add To Inventory" href="/inventory/add"></BreadcrumbItem> -->
	<BreadcrumbItem name="Edit Category"></BreadcrumbItem>
</Breadcrumb>
<h2 class="text-3xl mb-4 flex font-extrabold flex-row justify-between">
	Edit {data.category?.categoryName}
</h2>

<div class="md:px-4 py-2 md:py-4">
	<CategoryForm category={data.category} />
</div>
