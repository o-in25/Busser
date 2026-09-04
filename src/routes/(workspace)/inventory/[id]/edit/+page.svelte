<script lang="ts">
	import InventoryForm from '$lib/components/InventoryForm.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Edit {data.product.productName} - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<InventoryForm action="edit" product={data.product} isShared={data.isShared} />
</div>
