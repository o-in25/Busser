<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import InventoryForm from '$lib/components/InventoryForm.svelte';
	import Breadcrumb from '$lib/components/Breadcrumb.svelte';
	import BreadcrumbItem from '$lib/components/BreadcrumbItem.svelte';
</script>

<svelte:head>
	<title>New Inventory Item - Busser</title>
</svelte:head>
<Breadcrumb
	name="Inventory"
	href="/inventory"
>
	<BreadcrumbItem name="Add To Inventory"></BreadcrumbItem>
</Breadcrumb>
<h2 class="text-3xl mb-4 flex font-extrabold flex-row justify-between">
	New Inventory Item
</h2>

<div class="md:px-4 py-2 md:py-4">
	<InventoryForm action={'add'} />
</div>
