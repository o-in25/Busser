<script lang="ts">
	import BackButton from '$lib/components/BackButton.svelte';
	import InventoryForm from '$lib/components/InventoryForm.svelte';
</script>

<svelte:head>
	<title>Add Product - Inventory</title>
</svelte:head>

<div class="container mx-auto max-w-4xl">
	<!-- Header -->
	<div class="flex items-center gap-4 mb-6 mt-4">
		<BackButton fallback="/inventory" />
		<div>
			<h1 class="text-2xl font-bold">Add New Product</h1>
			<p class="text-muted-foreground">Add a new item to your inventory</p>
		</div>
	</div>

	<InventoryForm action="add" />
</div>
