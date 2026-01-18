<script lang="ts">
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
	import CategoryForm from '$lib/components/CategoryForm.svelte';
</script>

<svelte:head>
	<title>New Inventory Category - Busser</title>
</svelte:head>
<Breadcrumb
	name="Inventory"
	href="/inventory"
>
	<BreadcrumbItem
		name="Add To Inventory"
		href="/inventory/add"
	></BreadcrumbItem>
	<BreadcrumbItem name="Add Category"></BreadcrumbItem>
</Breadcrumb>
<h2 class="text-3xl mb-4 flex font-extrabold flex-row justify-between">
	New Inventory Category
</h2>

<div class="md:px-4 py-2 md:py-4">
	<CategoryForm />
</div>
