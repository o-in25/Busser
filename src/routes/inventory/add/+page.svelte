<script lang="ts">
	import { Heading } from 'flowbite-svelte';
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
<Heading
	tag="h2"
	class="mb-4 flex font-extrabold flex-row justify-between"
>
	New Inventory Item
</Heading>

<div class="md:px-4 py-2 md:py-4">
	<InventoryForm action={'add'} />
</div>
