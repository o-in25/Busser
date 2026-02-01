<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import InventoryForm from '$lib/components/InventoryForm.svelte';

	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Edit {data.product.productName} - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<BackButton fallback="/inventory" />
		<div>
			<h1 class="text-2xl font-bold">Edit Product</h1>
			<p class="text-muted-foreground">Update {data.product.productName}</p>
		</div>
	</div>

	<InventoryForm action="edit" product={data.product} />
</div>
